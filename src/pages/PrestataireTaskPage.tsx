import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const FUNCTION_URL = import.meta.env.VITE_PRESTATAIRE_FUNCTION_URL;

export default function PrestataireTaskPage() {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState([]);
  const [done, setDone] = useState(false);

  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${FUNCTION_URL}?token=${token}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setTask(data);
        setChecklist(data.checklist || []);
        setPhotos(data.photos || []);
        setNote(data.notes || "");
      }
      setLoading(false);
    };
    load();
  }, []);

  const toggleItem = (i) => {
    setChecklist((old) =>
      old.map((item, index) =>
        index === i ? { ...item, done: !item.done } : item
      )
    );
  };

  const uploadPhotos = async (e) => {
    const files = Array.from(e.target.files);
    const newPaths = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const name = `${crypto.randomUUID()}.${ext}`;
      const path = `${task.id}/${name}`;

      await supabase.storage.from("interventions-photos").upload(path, file);
      newPaths.push(path);
    }

    setPhotos((prev) => [...prev, ...newPaths]);
  };

  const finishTask = async () => {
    await fetch(`${FUNCTION_URL}?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checklist,
        note,
        photos,
        markDone: true,
      }),
    });

    setDone(true);
  };

  if (loading) return <p>Chargement…</p>;
  if (error) return <p>Erreur : {error}</p>;
  if (done) return <p>Merci ! Intervention terminée ✔</p>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-3">
        Intervention {task.type}
      </h1>

      <h2 className="font-semibold mt-4">Checklist</h2>
      {checklist.map((item, i) => (
        <label key={i} className="block">
          <input
            type="checkbox"
            checked={item.done}
            onChange={() => toggleItem(i)}
          />
          {" "}{item.label}
        </label>
      ))}

      <h2 className="font-semibold mt-4">Photos</h2>
      <input type="file" multiple onChange={uploadPhotos} />

      <h2 className="font-semibold mt-4">Note</h2>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="border rounded p-2 w-full"
        rows="3"
      />

      <button
        onClick={finishTask}
        className="mt-4 px-4 py-2 border rounded"
      >
        Terminer l’intervention
      </button>
    </div>
  );
}

