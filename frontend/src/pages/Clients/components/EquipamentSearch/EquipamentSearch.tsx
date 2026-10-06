import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faRotateLeft } from "@fortawesome/free-solid-svg-icons";

import type { FindEquipamentsFilters } from "../../../../modules/equipaments/equipaments.types";

import "./EquipamentSearch.css";

interface EquipamentSearchProps {
    clientId: string;
    isSearching: boolean;
    onSearch: (filters: FindEquipamentsFilters) => Promise<void>;
    onClear: () => void;
}

export function EquipamentSearch({
    clientId,
    isSearching,
    onSearch,
    onClear
}: EquipamentSearchProps) {
    const [type, setType] = useState("");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [mainIdentification, setMainIdentification] = useState("");
    const [additionalIdentification, setAdditionalIdentification] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        await onSearch({
            clientId,
            type: type.trim() || undefined,
            brand: brand.trim() || undefined,
            model: model.trim() || undefined,
            mainIdentification: mainIdentification.trim() || undefined,
            additionalIdentification: additionalIdentification.trim() || undefined
        });
    }

    function handleClear() {
        setType("");
        setBrand("");
        setModel("");
        setMainIdentification("");
        setAdditionalIdentification("");
        onClear();
    }

    return (
        <form className="equipament-search" onSubmit={handleSubmit}>
            <div className="equipament-search__field">
                <label htmlFor="equipament-search-type">Tipo</label>
                <input
                    id="equipament-search-type"
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    placeholder="Ex.: Caminhão"
                    disabled={isSearching}
                />
            </div>

            <div className="equipament-search__field">
                <label htmlFor="equipament-search-brand">Marca</label>
                <input
                    id="equipament-search-brand"
                    value={brand}
                    onChange={(event) => setBrand(event.target.value)}
                    placeholder="Ex.: Mercedes"
                    disabled={isSearching}
                />
            </div>

            <div className="equipament-search__field">
                <label htmlFor="equipament-search-model">Modelo</label>
                <input
                    id="equipament-search-model"
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    placeholder="Ex.: Atego"
                    disabled={isSearching}
                />
            </div>

            <div className="equipament-search__field">
                <label htmlFor="equipament-search-main">Identificação</label>
                <input
                    id="equipament-search-main"
                    value={mainIdentification}
                    onChange={(event) => setMainIdentification(event.target.value)}
                    placeholder="Identificação"
                    disabled={isSearching}
                />
            </div>

            <div className="equipament-search__field">
                <label htmlFor="equipament-search-additional">Identificação adicional</label>
                <input
                    id="equipament-search-additional"
                    value={additionalIdentification}
                    onChange={(event) => setAdditionalIdentification(event.target.value)}
                    placeholder="Identificação adicional"
                    disabled={isSearching}
                />
            </div>

            <div className="equipament-search__actions">
                <button type="button" onClick={handleClear} disabled={isSearching}>
                    <FontAwesomeIcon icon={faRotateLeft} />
                    Limpar
                </button>
                <button type="submit" disabled={isSearching}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                    {isSearching ? "Pesquisando..." : "Pesquisar"}
                </button>
            </div>
        </form>
    );
}
