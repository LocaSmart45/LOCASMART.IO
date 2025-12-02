import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function PrestataireTaskPage() {
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<any>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  // 1️⃣ Récupération du token dans l’URL
  const token = new URLSearchParams(window.location.search).get("token");

  // 2️⃣ Chargement de l’intervention liée au token
  useEffect(() => {
    async function loadTask() {
      if (!token) return;

      const { data, error } = await supabase
        .from("interventions")
        .select("*")
        .eq("prestataire_token", token)
        .single();

      if (error) {
        console.error(error);
        setTask(null);
      } else {
        setTask(data);
        setChecklist(data.checklist || {});
      }

      setLoading(false);
    }

    loadTask();
  }, [token]);

  // 3️⃣ Cocher/décocher une tâche
  const toggleCheck = (item: string) => {
    setChecklist((old) => ({ ...old, [item]: !old[item] }));
  };

  // 4️⃣ Upload photo → storage
  async function handlePhotoUpload(e: any) {
    const file = e.target.files[0];
    if (!file || !task) return;

    setUploading(true);

    const fileName = `${task.id}_${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from("prestataire-photos")
      .upload(fileName, file);

    if (error) {
      console.error(error);
      alert("Erreur upload photo");
      setUploading(false);
      return;
    }

    const publicUrl = supabase.storage
      .from("prestataire-photos")
      .getPublicUrl(fileName).data.publicUrl;

    setPhotoUrl(publicUrl);
    setUploading(false);
  }

  // 5️⃣ Terminer intervention
  async function finishTask() {
    if (!task) return;

    const { error } = await supabase
      .from("interventions")
      .update({
        statut: "terminée",
        checklist,
        prestataire_photo: photoUrl,
        prestataire_done_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    if (error) {
      console.error(error);
      alert("Erreur, impossible de terminer l’intervention");
      return;
    }

    setFinished(true);
  }

  // UI LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement…
      </div>
    );
  }

  // Token invalide
  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-xl">
        Intervention introuvable ❌
      </div>
    );
  }

  // Intervention terminée
  if (finished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-3xl font-bold text-green-600">✔ Intervention terminée</h1>
        <p className="mt-2 text-gray-600">Merci pour votre travail 🙏</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-6">

        <h1 className="text-2xl font-bold text-gray-800">
          Intervention : {task.type || "Tâche"}
        </h1>

        <p className="text-gray-600 mt-1">{task.description}</p>

        {/* Checklist */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Checklist</h2>
          <div className="mt-3 space-y-2">
            {Object.keys(checklist).map((item) => (
              <label key={item} className="flex gap-3 items-center">
                <input
                  type="checkbox"
                  checked={checklist[item]}
                  onChange={() => toggleCheck(item)}
                  className="w-5 h-5"
                />
                <span className="text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Upload Photo */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Photo du travail effectué</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="mt-2"
          />
          {uploading && <p className="text-blue-600 mt-2">Upload…</p>}
          {photoUrl && (
            <img
              src={photoUrl}
              alt="Upload"
              className="mt-4 rounded-lg shadow-md"
            />
          )}
        </div>

        {/* Bouton Terminer */}
        <button
          onClick={finishTask}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
        >
          Terminer l’intervention
        </button>
      </div>
    </div>
  );
}
