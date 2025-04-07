import { TextArea } from "@/components/textarea";
import { db } from "@/services/firebaseConnections";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { FaSpinner, FaTrash } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";
import styles from "./styles.module.css";

interface HomeProps {
  user: {
    email: string;
  };
}

interface TaskProps {
  id: string;
  created: string;
  tarefa: string;
  user: string;
  public: boolean;
}

export default function Dashboard({ user }: HomeProps) {
  const [input, setInput] = useState("");
  const [publicTask, setPublicTask] = useState(false);
  const [tasks, setTasks] = useState<TaskProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadTasks() {
      const tasksRef = collection(db, "tarefas");
      const q = query(
        tasksRef,
        orderBy("created", "desc"),
        where("user", "==", user?.email)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let list = [] as TaskProps[];
        snapshot.forEach((doc) => {
          list.push({
            id: doc.id,
            created: doc.data().created,
            tarefa: doc.data().tarefa,
            user: doc.data().user,
            public: doc.data().public,
          });
        });
        setTasks(list);
        setLoading(false);
      });

      return () => unsubscribe();
    }
    loadTasks();
  }, [user?.email]);

  function handleChangePublic(event: ChangeEvent<HTMLInputElement>) {
    setPublicTask(event.target.checked);
  }

  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();
    if (input.trim() === "") return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "tarefas"), {
        tarefa: input,
        created: new Date(),
        user: user?.email,
        public: publicTask,
      });
      setInput("");
      setPublicTask(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleShare(id: string) {
    try {
      await navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_URL}/task/${id}`
      );
      alert("Link copiado com sucesso!");
    } catch (err) {
      console.error("Falha ao copiar link", err);
      alert("Erro ao copiar link");
    }
  }

  async function handleDelete(id: string) {
    const confirm = window.confirm(
      "Tem certeza que deseja excluir esta tarefa?"
    );
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "tarefas", id));
    } catch (err) {
      console.error("Erro ao excluir tarefa", err);
      alert("Erro ao excluir tarefa");
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Meu painel de tarefas</title>
        <meta name="description" content="Organize suas tarefas pessoais" />
      </Head>

      <main className={styles.main}>
        <section className={styles.content}>
          <div className={styles.contentForm}>
            <h1 className={styles.title}>Qual sua tarefa?</h1>

            <form onSubmit={handleRegisterTask}>
              <TextArea
                placeholder="Digite qual sua tarefa..."
                value={input}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setInput(event.target.value)
                }
                disabled={submitting}
              />
              <div className={styles.checkboxArea}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={publicTask}
                  onChange={handleChangePublic}
                  id="publicTask"
                  disabled={submitting}
                />
                <label htmlFor="publicTask">Deixar tarefa pública?</label>
              </div>

              <button
                className={styles.button}
                type="submit"
                disabled={input.trim() === "" || submitting}
              >
                {submitting ? <FaSpinner className="spin" /> : "Registrar"}
              </button>
            </form>
          </div>
        </section>

        <section className={styles.taskContainer}>
          <h1>Minhas tarefas</h1>

          {loading ? (
            <div className={styles.loading}>
              <FaSpinner className="spin" size={24} />
            </div>
          ) : tasks.length === 0 ? (
            <div className={styles.emptyTasks}>
              <p>Nenhuma tarefa encontrada</p>
            </div>
          ) : (
            tasks.map((item) => (
              <article key={item.id} className={styles.task}>
                {item.public && (
                  <div className={styles.tagContainer}>
                    <label className={styles.tag}>PÚBLICO</label>
                    <button
                      className={styles.shareButton}
                      onClick={() => handleShare(item.id)}
                      aria-label="Compartilhar tarefa"
                    >
                      <FiShare2 size={18} />
                    </button>
                  </div>
                )}

                <div className={styles.taskContent}>
                  {item.public ? (
                    <Link href={`/task/${item.id}`}>
                      <p>{item.tarefa}</p>
                    </Link>
                  ) : (
                    <p>{item.tarefa}</p>
                  )}
                  <button
                    className={styles.trashButton}
                    onClick={() => handleDelete(item.id)}
                    aria-label="Excluir tarefa"
                  >
                    <FaTrash size={18} />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

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

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });

  if (!session?.user) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        email: session.user.email,
      },
    },
  };
};
