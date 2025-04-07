import { TextArea } from "@/components/textarea";
import { db } from "@/services/firebaseConnections";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { ChangeEvent, FormEvent, useState } from "react";
import { FaSpinner, FaTrash } from "react-icons/fa";
import styles from "./styles.module.css";

interface TaskProps {
  item: {
    tarefa: string;
    user: string;
    public: boolean;
    taskId: string;
    created: string;
  };
  allComments: CommentProps[];
}

interface CommentProps {
  id: string;
  comment: string;
  taskId: string;
  user: string;
  name: string;
  created?: string;
}

export default function Task({ item, allComments }: TaskProps) {
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const [comments, setComments] = useState<CommentProps[]>(allComments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  async function handleComment(event: FormEvent) {
    event.preventDefault();

    if (input.trim() === "" || !session?.user?.email || !session?.user?.name)
      return;

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "comments"), {
        comment: input.trim(),
        taskId: item.taskId,
        user: session.user.email,
        name: session.user.name,
        created: new Date().toISOString(),
      });

      const newComment = {
        id: docRef.id,
        comment: input.trim(),
        taskId: item.taskId,
        user: session.user.email,
        name: session.user.name,
        created: new Date().toLocaleString("pt-BR"),
      };

      setComments((prev) => [newComment, ...prev]);
      setInput("");
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err);
      alert("Ocorreu um erro ao enviar o comentário");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteComment(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir este comentário?"))
      return;

    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, "comments", id));
      setComments((prev) => prev.filter((comment) => comment.id !== id));
    } catch (err) {
      console.error("Erro ao excluir comentário:", err);
      alert("Ocorreu um erro ao excluir o comentário");
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>{`${item.tarefa}`}</title>
        <meta
          name="description"
          content={`Detalhes da tarefa: ${item.tarefa}`}
        />
      </Head>

      <main className={styles.main}>
        <h1>Tarefa</h1>
        <article className={styles.task}>
          <p>{item.tarefa}</p>
        </article>
      </main>

      <section className={styles.commentsContainer}>
        <h2>Deixar comentário</h2>
        <form className={styles.form} onSubmit={handleComment}>
          <TextArea
            value={input}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
            placeholder="Digite seu comentário..."
            disabled={!session?.user}
          />
          <button
            type="submit"
            className={styles.button}
            disabled={!session?.user || input.trim() === "" || isSubmitting}
          >
            {isSubmitting ? (
              <FaSpinner className="spin" />
            ) : (
              "Enviar Comentário"
            )}
          </button>
        </form>
      </section>

      <section className={styles.comments}>
        <h2>Todos comentários</h2>

        {comments.length === 0 ? (
          <span className={styles.noComments}>
            Nenhum comentário encontrado
          </span>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className={styles.comment}>
              <div className={styles.headComment}>
                <label className={styles.commentsLabel}>{comment.name}</label>
                {comment.created && (
                  <span style={{ color: "#a8a8b3", fontSize: "0.8rem" }}>
                    {new Date(comment.created).toLocaleDateString("pt-BR")}
                  </span>
                )}
                {comment.user === session?.user?.email && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className={styles.buttonTrash}
                    disabled={isDeleting === comment.id}
                    aria-label="Excluir comentário"
                  >
                    {isDeleting === comment.id ? (
                      <FaSpinner className="spin" size={14} />
                    ) : (
                      <FaTrash size={14} />
                    )}
                  </button>
                )}
              </div>
              <p>{comment.comment}</p>
            </article>
          ))
        )}
      </section>

      <style jsx global>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id as string;

  if (!id) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  try {
    // Buscar a tarefa
    const docRef = doc(db, "tarefas", id);
    const taskSnapshot = await getDoc(docRef);

    if (!taskSnapshot.exists() || !taskSnapshot.data()?.public) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    // Buscar comentários
    const commentsQuery = query(
      collection(db, "comments"),
      where("taskId", "==", id)
    );
    const commentsSnapshot = await getDocs(commentsQuery);

    const allComments: CommentProps[] = commentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      comment: doc.data().comment,
      taskId: doc.data().taskId,
      user: doc.data().user,
      name: doc.data().name,
      created: doc.data().created?.toDate().toLocaleString("pt-BR"),
    }));

    // Ordenar comentários do mais novo para o mais antigo
    allComments.sort(
      (a, b) =>
        new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime()
    );

    const task = {
      tarefa: taskSnapshot.data()?.tarefa,
      public: taskSnapshot.data()?.public,
      created: taskSnapshot
        .data()
        ?.created?.toDate()
        .toLocaleDateString("pt-BR"),
      user: taskSnapshot.data()?.user,
      taskId: taskSnapshot.id,
    };

    return {
      props: {
        item: task,
        allComments,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
};
