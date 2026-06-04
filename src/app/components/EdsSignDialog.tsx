import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CheckCircle2, KeyRound, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  getAvailableCertificates,
  isCertificateValid,
  signData,
  EDS_HASH_ALGORITHM,
  type Signature,
} from '../lib/eds';
import { currentUser } from '../data/mockData';

interface EdsSignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  // Текст подписываемых данных (попадает в хеш).
  payload: string;
  onSigned: (signature: Signature) => void;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export function EdsSignDialog({ open, onOpenChange, title, payload, onSigned }: EdsSignDialogProps) {
  const certificates = useMemo(() => getAvailableCertificates(currentUser), []);
  const [certId, setCertId] = useState<string>(certificates[0]?.id ?? '');
  const [result, setResult] = useState<Signature | null>(null);

  // Сброс состояния при каждом открытии.
  useEffect(() => {
    if (open) {
      setCertId(certificates[0]?.id ?? '');
      setResult(null);
    }
  }, [open, certificates]);

  const selectedCert = certificates.find((c) => c.id === certId);
  const certValid = selectedCert ? isCertificateValid(selectedCert) : false;

  const handleSign = () => {
    if (!selectedCert || !certValid) return;
    const signature = signData(selectedCert, payload, selectedCert.subject);
    setResult(signature);
    onSigned(signature);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Подписание ЭЦП
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
              <p className="text-xs text-gray-500">Подписываемая операция</p>
              <p className="mt-0.5 font-medium text-gray-900">{title}</p>
              <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600">{payload}</p>
            </div>

            {certificates.length === 0 ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Для текущей учётной записи не найдено сертификатов ЭЦП.
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-gray-500" />
                  Сертификат подписи
                </Label>
                <Select value={certId} onValueChange={setCertId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {certificates.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.subject} — {c.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedCert && (
                  <div className="space-y-1 rounded-md border border-gray-100 bg-white px-3 py-2 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-400">Серийный номер: </span>
                      <span className="font-mono">{selectedCert.serial}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Издатель: </span>
                      {selectedCert.issuer}
                    </div>
                    <div>
                      <span className="text-gray-400">Действителен: </span>
                      {selectedCert.validFrom} — {selectedCert.validTo}
                      {certValid ? (
                        <span className="ml-1 text-emerald-600">(действует)</span>
                      ) : (
                        <span className="ml-1 text-red-600">(недействителен)</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-400">Алгоритм хеширования: </span>
                      {EDS_HASH_ALGORITHM}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Операция подписана электронной подписью
            </div>
            <div className="space-y-1 rounded-md border border-gray-100 bg-white px-3 py-2 text-xs text-gray-600">
              <div>
                <span className="text-gray-400">Подписант: </span>
                <span className="text-gray-900">{result.signerName}</span>
              </div>
              <div>
                <span className="text-gray-400">Дата подписи: </span>
                {formatDateTime(result.signedAt)}
              </div>
              <div>
                <span className="text-gray-400">Алгоритм: </span>
                {result.signAlgorithm}
              </div>
              <div className="break-all">
                <span className="text-gray-400">Хеш (Стрибог): </span>
                <span className="font-mono">{result.dataHash}</span>
              </div>
              <div className="break-all">
                <span className="text-gray-400">Значение подписи: </span>
                <span className="font-mono">{result.signatureValue}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!result ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button size="sm" onClick={handleSign} disabled={!selectedCert || !certValid}>
                <ShieldCheck className="h-4 w-4" />
                Подписать
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Готово
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
