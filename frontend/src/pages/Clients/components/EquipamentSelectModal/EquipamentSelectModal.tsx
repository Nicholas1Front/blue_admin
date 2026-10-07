import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../../components/Modal/Modal";
import type { Equipament } from "../../../../modules/equipaments/equipaments.types";
import "./EquipamentSelectModal.css";

interface Props {
    isOpen: boolean;
    title: string;
    equipaments: Equipament[];
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    onSelect: (equipament: Equipament) => void;
}

export function EquipamentSelectModal({
    isOpen, title, equipaments, isLoading, error, onClose, onSelect
}: Props) {
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isOpen) setSearch("");
    }, [isOpen]);

    const filteredEquipaments = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase();
        if (!normalizedSearch) return equipaments;
        return equipaments.filter((equipament) =>
            [equipament.type, equipament.brand, equipament.model, equipament.mainIdentification, equipament.additionalIdentification]
                .filter((value): value is string => Boolean(value))
                .join(" ")
                .toLocaleLowerCase()
                .includes(normalizedSearch)
        );
    }, [equipaments, search]);

    return (
        <Modal isOpen={isOpen} title={title} onClose={onClose}>
            <div className="equipament-select">
                <div className="equipament-select__field">
                    <label htmlFor="equipament-select-search">Pesquisar equipamento</label>
                    <input
                        id="equipament-select-search"
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Digite tipo, marca, modelo ou identificação"
                        disabled={isLoading}
                        autoFocus
                    />
                </div>

                {isLoading && <div className="equipament-select__feedback"><p>Carregando equipamentos...</p></div>}
                {!isLoading && error && <div className="equipament-select__feedback" role="alert"><p>{error}</p></div>}
                {!isLoading && !error && filteredEquipaments.length === 0 && (
                    <div className="equipament-select__feedback">
                        <p>{equipaments.length === 0 ? "Nenhum equipamento cadastrado para este cliente." : "Nenhum equipamento encontrado."}</p>
                    </div>
                )}

                {!isLoading && !error && filteredEquipaments.length > 0 && (
                    <div className="equipament-select__list">
                        {filteredEquipaments.map((equipament) => (
                            <button className="equipament-select__item" key={equipament.id} type="button" onClick={() => onSelect(equipament)}>
                                <strong>{equipament.type} — {equipament.brand}</strong>
                                <span>{[equipament.model, equipament.mainIdentification, equipament.additionalIdentification].filter((value): value is string => Boolean(value)).join(" • ") || "Sem identificação adicional"}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="equipament-select__actions">
                    <button className="equipament-select__cancel" type="button" onClick={onClose} disabled={isLoading}>Cancelar</button>
                </div>
            </div>
        </Modal>
    );
}
