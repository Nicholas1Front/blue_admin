import {
    useEffect,
    type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import "./Modal.css";

interface ModalProps {
    isOpen: boolean;
    title: string;
    children: ReactNode;
    onClose: () => void;
}

export function Modal({
    isOpen,
    title,
    children,
    onClose
}: ModalProps) {
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return createPortal(
        <div
            className="modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <section
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="modal__header">
                    <h2 id="modal-title">{title}</h2>

                    <button
                        className="modal__close"
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar"
                        title="Fechar"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </header>

                <div className="modal__content">
                    {children}
                </div>
            </section>
        </div>,
        document.body
    );
}
