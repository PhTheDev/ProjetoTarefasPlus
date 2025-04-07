import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import styles from "./header.module.css";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logoLink}>
            <h1 className={styles.logo}>
              Tarefas<span>+</span>
            </h1>
          </Link>

          {session?.user && (
            <Link href="/dashboard" className={styles.link}>
              Meu Painel
            </Link>
          )}
        </nav>

        <div className={styles.authSection}>
          {status === "loading" ? (
            <div className={styles.skeletonLoader}></div>
          ) : session ? (
            <div className={styles.userProfile}>
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt="User avatar"
                  width={40}
                  height={40}
                  className={styles.avatar}
                />
              )}
              <button
                className={styles.loginButton}
                onClick={() => signOut()}
                aria-label="Sair da conta"
              >
                <span className={styles.userName}>
                  {session.user?.name?.split(" ")[0]}
                </span>
              </button>
            </div>
          ) : (
            <button
              className={styles.loginButton}
              onClick={() => signIn("google")}
              aria-label="Acessar conta"
            >
              Acessar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
