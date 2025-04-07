import { forwardRef, TextareaHTMLAttributes } from "react";
import styles from "./styles.module.css";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "ghost";
  charLimit?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ variant = "default", charLimit, className, ...rest }, ref) => {
    const currentLength = rest.value?.toString().length || 0;
    const isLimitExceeded = charLimit ? currentLength > charLimit : false;

    return (
      <div className={styles.container}>
        <textarea
          ref={ref}
          className={`${styles.textarea} ${styles[variant]} ${
            isLimitExceeded ? styles.charLimitExceeded : ""
          } ${className || ""}`}
          {...rest}
        />
        {charLimit && (
          <div className={styles.charCounter}>
            {currentLength}/{charLimit}
          </div>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
