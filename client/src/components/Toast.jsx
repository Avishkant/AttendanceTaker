import { useEffect, useState } from "react";

export default function Toast({ message, type = "info", onClose }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onClose && onClose();
    }, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  if (!visible) return null;
  const bg =
    type === "error"
      ? "bg-red-500"
      : type === "success"
      ? "bg-green-500"
      : "bg-blue-500";
  return (
    <div
      className={`fixed top-6 right-6 z-50 ${bg} text-white px-4 py-2 rounded shadow`}
    >
      {message}
    </div>
  );
}
