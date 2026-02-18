import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api/client';

export function Faqs() {
  const [items, setItems] = useState<{ id: number; question: string; answer: string; order: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{ id: number; question: string; answer: string } | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  function load() {
    setLoading(true);
    api.faqs
      .list()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (editing) {
      api.faqs
        .update(editing.id, { question: question.trim(), answer: answer.trim() })
        .then(() => {
          setEditing(null);
          setQuestion('');
          setAnswer('');
          load();
        })
        .catch((e) => setError(e.message));
    } else {
      api.faqs
        .create({ question: question.trim(), answer: answer.trim() })
        .then(() => {
          setQuestion('');
          setAnswer('');
          setShowForm(false);
          load();
        })
        .catch((e) => setError(e.message));
    }
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this FAQ?')) return;
    api.faqs
      .delete(id)
      .then(load)
      .catch((e) => setError(e.message));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-display">FAQ</h1>
        <button
          onClick={() => {
            setEditing(null);
            setQuestion('');
            setAnswer('');
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-full font-medium hover:bg-accent-hover border border-accent transition-colors"
        >
          <Plus size={20} />
          Add FAQ
        </button>
      </div>

      {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-bg-card rounded-xl border border-border-primary">
          <label className="block mb-2 text-text-secondary text-sm">Title</label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full max-w-md bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary mb-3"
            placeholder="FAQ title"
            required
          />
          <label className="block mb-2 text-text-secondary text-sm">Description</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full max-w-md bg-bg-tertiary border border-border-primary rounded-full border border-border-primary py-2 px-4 text-text-primary min-h-[100px]"
            placeholder="FAQ description"
            required
          />
          <div className="mt-3 flex gap-2">
            <button type="submit" className="bg-accent text-bg-primary px-4 py-2 rounded-full font-medium border border-accent">
              {editing ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                setQuestion('');
                setAnswer('');
              }}
              className="border border-border-primary px-4 py-2 rounded-full"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No FAQs yet. Add one to get started.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-bg-tertiary border-b border-border-primary">
              <tr>
                <th className="p-4 font-medium text-text-secondary">Question</th>
                <th className="p-4 font-medium text-text-secondary">Answer</th>
                <th className="p-4 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {items.map((f) => (
                <tr key={f.id} className="hover:bg-bg-hover transition-colors">
                  <td className="p-4 font-medium max-w-xs truncate">{f.question}</td>
                  <td className="p-4 text-text-muted max-w-md truncate">{f.answer}</td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => {
                        setEditing({ id: f.id, question: f.question, answer: f.answer });
                        setQuestion(f.question);
                        setAnswer(f.answer);
                        setShowForm(true);
                      }}
                      className="p-2 text-text-muted hover:text-accent"
                    >
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(f.id)} className="p-2 text-text-muted hover:text-red-400">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
