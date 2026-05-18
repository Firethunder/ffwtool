import { ref } from "vue";
import { useTermineStore } from "./useTermineStore";
import { terminSchema } from "../utils/validation";
import { formatDate } from "../utils/date";

export function useTermineForm(toast) {
  const { data } = useTermineStore();

  const newTermin = ref({
    datum: "",
    datumDate: null,
    name: "",
    veranstalter: "Alle",
    Gruppe: "Alle",
    ort: data.value.defaultOrt || "Feuerwehrhaus Brittheim",
    dauer: data.value.defaultDauer || 120,
  });

  const validationErrors = ref({});

  const addTermin = () => {
    try {
      const validated = terminSchema.parse(newTermin.value);
      const maxId = Math.max(0, ...data.value.termine.map((t) => t.id));
      data.value.termine.push({
        ...validated,
        id: maxId + 1,
        datumDate: newTermin.value.datumDate,
      });

      // Reset form
      newTermin.value = {
        datum: "",
        datumDate: null,
        name: "",
        veranstalter: "Alle",
        Gruppe: "Alle",
        ort: data.value.defaultOrt || "Feuerwehrhaus Brittheim",
        dauer: data.value.defaultDauer || 120,
      }
      validationErrors.value = {};
      data.value.stand = formatDate(new Date());

      toast?.add({
        severity: "success",
        summary: "Hinzugefügt",
        detail: "Termin wurde gespeichert",
        life: 3000,
      });
      } catch (err) {
      toast?.add({
        severity: "error",
        summary: "Fehler",
        detail: "Bitte prüfen Sie die Eingaben.",
        life: 3000,
      });
      if (err.errors) {
        validationErrors.value = err.errors.reduce((acc, curr) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        }, {});
      }
    }
  };

  return {
    newTermin,
    validationErrors,
    addTermin,
  };
}
