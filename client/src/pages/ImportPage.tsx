import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileUp, ShieldCheck, XCircle } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useStatementImport } from "@/hooks/useStatementImport";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { getApiErrorMessage } from "@/api/client";
import { isDemoMode } from "@/lib/demoMode";
import { ACCOUNT_TYPE_LABELS, IMPORTABLE_ACCOUNT_TYPES, MAX_STATEMENT_BYTES } from "@/lib/constants";
import type { SkippedRow, StatementImport } from "@/types";

/** Client-side pre-check; the server validates the same rules again. */
function validateFile(file: File | null): string | null {
  if (!file) return "Vyber súbor s výpisom.";
  if (!file.name.toLowerCase().endsWith(".csv")) return "Výpis musí byť vo formáte CSV.";
  if (file.size === 0) return "Súbor je prázdny.";
  if (file.size > MAX_STATEMENT_BYTES) return "Súbor je väčší ako 2 MB.";
  return null;
}

/** Groups skipped rows by reason, e.g. "stav PENDING" → 3, most frequent first. */
function summarizeSkipped(rows: SkippedRow[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const { reason } of rows) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function ImportPage() {
  const demo = isDemoMode();
  const { accounts, isLoading } = useAccounts();
  const { startImport, isStarting, result, isProcessing, pollError, reset } = useStatementImport();
  const importableAccounts = useMemo(
    () => accounts.filter((a) => IMPORTABLE_ACCOUNT_TYPES.includes(a.type)),
    [accounts]
  );
  const [accountId, setAccountId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedAccountId = accountId || importableAccounts[0]?.id || "";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const fileError = demo ? null : validateFile(file);
    if (fileError) return setError(fileError);
    try {
      await startImport({ accountId: selectedAccountId, file });
    } catch (err) {
      setError(getApiErrorMessage(err, "Import sa nepodarilo spustiť."));
    }
  }

  function startOver() {
    reset();
    setFile(null);
    setError(null);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Import výpisu</h1>
        <p className="mt-1 text-sm text-slate-500">
          Nahraj CSV výpis z Revolutu a transakcie sa doplnia automaticky. Opakovaný import toho istého výpisu nič
          nezdvojí.
        </p>
      </div>

      {importableAccounts.length === 0 ? (
        <EmptyState
          title="Nemáš účet, do ktorého sa dá importovať"
          description="Výpis sa dá importovať do bankového, kartového alebo sporiaceho účtu."
          action={
            <Link to="/accounts">
              <Button>Pridať účet</Button>
            </Link>
          }
        />
      ) : result ? (
        <ImportResult result={result} isProcessing={isProcessing} pollError={pollError} onStartOver={startOver} />
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Select
              label="Účet"
              name="accountId"
              value={selectedAccountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {importableAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({ACCOUNT_TYPE_LABELS[a.type]})
                </option>
              ))}
            </Select>

            {demo ? (
              <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
                V demo režime sa namiesto vlastného súboru naimportuje ukážkový výpis s vymyslenými transakciami.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <label htmlFor="statement" className="text-sm font-medium text-slate-700">
                  Súbor s výpisom (CSV)
                </label>
                <input
                  id="statement"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
                />
                <p className="text-xs text-slate-500">
                  V appke Revolut: účet → Výpis → formát Excel/CSV. Bežný účet importuj do bankového účtu, sporenie
                  do sporiaceho.
                </p>
              </div>
            )}

            {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

            <Button type="submit" isLoading={isStarting} className="self-start">
              <FileUp className="h-4 w-4" />
              {demo ? "Nahrať ukážkový výpis" : "Importovať"}
            </Button>
          </form>
        </Card>
      )}

      <p className="flex items-start gap-2 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
        Výpis sa spracuje na pozadí a pôvodný súbor sa po spracovaní zo servera vymaže. Uložia sa len transakcie
        viditeľné iba pre teba.
      </p>
    </div>
  );
}

function ImportResult({
  result,
  isProcessing,
  pollError,
  onStartOver,
}: {
  result: StatementImport;
  isProcessing: boolean;
  pollError: Error | null;
  onStartOver: () => void;
}) {
  if (isProcessing) {
    return (
      <Card className="flex items-center gap-3">
        <Spinner />
        <div>
          <p className="text-sm font-medium text-slate-900">Spracúvam výpis…</p>
          <p className="text-xs text-slate-500">{result.fileName}</p>
          {pollError && (
            <p className="mt-1 text-xs text-red-600">{getApiErrorMessage(pollError, "Stav importu sa nedá načítať.")}</p>
          )}
        </div>
      </Card>
    );
  }

  if (result.status === "FAILED") {
    return (
      <Card className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-red-700">
          <XCircle className="h-5 w-5" />
          Import zlyhal
        </p>
        <p className="text-sm text-slate-600">{result.error ?? "Neznáma chyba."}</p>
        <Button variant="secondary" onClick={onStartOver} className="self-start">
          Skúsiť znova
        </Button>
      </Card>
    );
  }

  if (result.status !== "DONE") {
    // Polling gave up while the job is still queued (e.g. the worker is down).
    return (
      <Card className="flex flex-col gap-3">
        <p className="text-sm text-slate-600">Import stále čaká na spracovanie. Skontroluj ho o chvíľu.</p>
        <Button variant="secondary" onClick={onStartOver} className="self-start">
          Späť
        </Button>
      </Card>
    );
  }

  const skipped = summarizeSkipped(result.skippedRows ?? []);
  return (
    <Card className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-sm font-medium text-green-700">
        <CheckCircle2 className="h-5 w-5" />
        Import dokončený
      </p>
      <dl className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Importované" value={result.imported} />
        <Stat label="Duplikáty" value={result.duplicates} />
        <Stat label="Preskočené" value={result.skippedRows?.length ?? 0} />
      </dl>
      {skipped.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-slate-600">
          {skipped.map(([reason, count]) => (
            <li key={reason}>
              {count}× {reason}
            </li>
          ))}
        </ul>
      )}
      {result.imported > 0 && (
        <p className="text-sm text-slate-600">
          Nové transakcie sú v kategórii „Nezaradené“. Kategóriu im môžeš zmeniť v zozname transakcií.
        </p>
      )}
      <div className="flex gap-2">
        <Link to="/transactions">
          <Button>Zobraziť transakcie</Button>
        </Link>
        <Button variant="secondary" onClick={onStartOver}>
          Importovať ďalší
        </Button>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-lg font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
