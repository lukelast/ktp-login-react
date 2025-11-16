import React from "react";

export interface MyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export const MyButton: React.FC<MyButtonProps> = ({
  variant = "primary",
  children,
  ...rest
}) => {
  return (
    <button
      {...rest}
      className={`my-btn my-btn-${variant} ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
};
