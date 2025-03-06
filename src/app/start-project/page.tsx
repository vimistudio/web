"use client";

import { motion } from "framer-motion";
import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";

export default function StartProject() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { t, language } = useLanguage();

  // Función para capitalizar la primera letra
  const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Usando useMemo para calcular el mes formateado en lugar de un estado separado
  const formattedMonth = useMemo(() => {
    const monthName = currentDate.toLocaleString(
      language === "es" ? "es-ES" : "en-US",
      { month: "long" }
    );

    // Asegurar que el mes comience con mayúscula
    const capitalizedMonth = capitalizeFirstLetter(monthName);
    return `${capitalizedMonth} ${currentDate.getFullYear()}`;
  }, [currentDate, language]);

  // Efecto para inicializar Cal
  useEffect(() => {
    // Initialize Cal when the component mounts
    (async () => {
      const cal = await getCalApi();
      cal("ui", {
        styles: { branding: { brandColor: "#777EF0" } },
        hideEventTypeDetails: false,
      });
    })();

    // Configurar el temporizador para actualizar la fecha al cambio de mes
    const getMillisecondsUntilNextMonth = () => {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return nextMonth.getTime() - now.getTime();
    };

    const updateDate = () => {
      setCurrentDate(new Date());
    };

    const setMonthUpdateInterval = () => {
      const timeUntilNextMonth = getMillisecondsUntilNextMonth();

      // Configurar un temporizador para el próximo cambio de mes
      const timerId = setTimeout(() => {
        updateDate();
        // Volver a configurar el temporizador para el siguiente mes
        setMonthUpdateInterval();
      }, timeUntilNextMonth);

      return timerId;
    };

    // Iniciar el temporizador para la actualización del mes
    const timerId = setMonthUpdateInterval();

    // Limpieza al desmontar el componente
    return () => clearTimeout(timerId);
  }, []); // Sin dependencia de language

  return (
    <motion.main
      key="start-project"
      className="flex-1 flex items-center justify-center py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 px-4">
          {t("createSomethingRemarkable")}
        </h1>
        <div className="flex flex-col items-center justify-center mb-8 px-4">
          <div className="flex items-center mb-2 sm:mb-0">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse flex-shrink-0"></div>
            <p className="text-lg sm:text-xl">{t("getInTouch")}</p>
          </div>
          <div className="mb-4 text-lg text-gray-700">
            {t("newSpotsOpen")} {formattedMonth}.
          </div>
        </div>
        <div className="inline-block w-full max-w-4xl">
          <Cal
            calLink="vimistudio"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "600px",
              position: "relative",
            }}
            config={{
              name: "Vimi Studio",
              styles: {
                branding: "#777EF0",
              },
            }}
          />
        </div>
      </div>
    </motion.main>
  );
}
