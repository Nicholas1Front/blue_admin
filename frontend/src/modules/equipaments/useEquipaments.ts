import { useCallback, useState } from "react";

import {
    createEquipament,
    deleteEquipament,
    findEquipaments,
    updateEquipament
} from "./equipaments.api";

import type {
    CreateEquipamentRequest,
    Equipament,
    FindEquipamentsFilters,
    UpdateEquipamentRequest
} from "./equipaments.types";

interface UseEquipamentsReturn {
    equipaments: Equipament[];
    searchResults: Equipament[];

    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    isSearching: boolean;

    error: string | null;
    createError: string | null;
    updateError: string | null;
    deleteError: string | null;
    searchError: string | null;

    hasSearched: boolean;

    loadEquipaments: (clientId: string) => Promise<void>;
    searchEquipaments: (filters: FindEquipamentsFilters) => Promise<void>;
    clearSearch: () => void;

    clearCreateError: () => void;
    clearUpdateError: () => void;
    clearDeleteError: () => void;

    addEquipament: (
        clientId: string,
        data: CreateEquipamentRequest
    ) => Promise<Equipament>;

    editEquipament: (
        id: string,
        data: UpdateEquipamentRequest
    ) => Promise<Equipament>;

    removeEquipament: (id: string) => Promise<void>;
}

export function useEquipaments(): UseEquipamentsReturn {
    const [equipaments, setEquipaments] = useState<Equipament[]>([]);
    const [searchResults, setSearchResults] = useState<Equipament[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);

    const [hasSearched, setHasSearched] = useState(false);

    const loadEquipaments = useCallback(
        async (clientId: string) => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await findEquipaments({ clientId });
                setEquipaments(data);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível carregar os equipamentos.";

                setError(message);
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    const searchEquipaments = useCallback(
        async (filters: FindEquipamentsFilters) => {
            setIsSearching(true);
            setSearchError(null);
            setHasSearched(true);

            try {
                const data = await findEquipaments(filters);
                setSearchResults(data);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível pesquisar os equipamentos.";

                setSearchError(message);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        },
        []
    );

    const clearSearch = useCallback(() => {
        setSearchResults([]);
        setSearchError(null);
        setHasSearched(false);
    }, []);

    const addEquipament = useCallback(
        async (
            clientId: string,
            data: CreateEquipamentRequest
        ) => {
            setIsCreating(true);
            setCreateError(null);

            try {
                const newEquipament = await createEquipament(clientId, data);

                setEquipaments((currentEquipaments) => [
                    ...currentEquipaments,
                    newEquipament
                ]);

                return newEquipament;
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível criar o equipamento.";

                setCreateError(message);
                throw error;
            } finally {
                setIsCreating(false);
            }
        },
        []
    );

    const editEquipament = useCallback(
        async (
            id: string,
            data: UpdateEquipamentRequest
        ) => {
            setIsUpdating(true);
            setUpdateError(null);

            try {
                const updatedEquipament = await updateEquipament(id, data);

                setEquipaments((currentEquipaments) =>
                    currentEquipaments.map((equipament) =>
                        equipament.id === updatedEquipament.id
                            ? updatedEquipament
                            : equipament
                    )
                );

                setSearchResults((currentResults) =>
                    currentResults.map((equipament) =>
                        equipament.id === updatedEquipament.id
                            ? updatedEquipament
                            : equipament
                    )
                );

                return updatedEquipament;
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar o equipamento.";

                setUpdateError(message);
                throw error;
            } finally {
                setIsUpdating(false);
            }
        },
        []
    );

    const removeEquipament = useCallback(
        async (id: string) => {
            setIsDeleting(true);
            setDeleteError(null);

            try {
                await deleteEquipament(id);

                setEquipaments((currentEquipaments) =>
                    currentEquipaments.filter(
                        (equipament) => equipament.id !== id
                    )
                );

                setSearchResults((currentResults) =>
                    currentResults.filter(
                        (equipament) => equipament.id !== id
                    )
                );
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Não foi possível excluir o equipamento.";

                setDeleteError(message);
                throw error;
            } finally {
                setIsDeleting(false);
            }
        },
        []
    );

    const clearCreateError = useCallback(() => {
        setCreateError(null);
    }, []);

    const clearUpdateError = useCallback(() => {
        setUpdateError(null);
    }, []);

    const clearDeleteError = useCallback(() => {
        setDeleteError(null);
    }, []);

    return {
        equipaments,
        searchResults,

        isLoading,
        isCreating,
        isUpdating,
        isDeleting,
        isSearching,

        error,
        createError,
        updateError,
        deleteError,
        searchError,

        hasSearched,

        loadEquipaments,
        searchEquipaments,
        clearSearch,

        clearCreateError,
        clearUpdateError,
        clearDeleteError,

        addEquipament,
        editEquipament,
        removeEquipament
    };
}
