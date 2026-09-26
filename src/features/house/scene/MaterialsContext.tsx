"use client";

import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useEffect, useMemo } from "react";
import { createMaterialLibrary, type MaterialLibrary, updateNightMaterials } from "../models/materials";
import { frameState, useStudio } from "../ui/store";

const MaterialsContext = createContext<MaterialLibrary | null>(null);

export function MaterialsProvider({ children }: { children: React.ReactNode }) {
  const quality = useStudio((state) => state.quality);
  const library = useMemo(() => createMaterialLibrary(quality), [quality]);

  useEffect(() => () => library.dispose(), [library]);

  useFrame(() => updateNightMaterials(library, frameState.sky.night, frameState.time));

  return <MaterialsContext.Provider value={library}>{children}</MaterialsContext.Provider>;
}

export function useMaterials(): MaterialLibrary {
  const library = useContext(MaterialsContext);
  if (!library) throw new Error("useMaterials must be used inside <MaterialsProvider>");
  return library;
}
