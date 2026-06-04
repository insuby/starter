import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { FileSpreadsheet, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  buildReport,
  reportTypeNames,
  type ReportLevel,
  type ReportResult,
  type ReportType,
} from '../lib/reports';
import { exportToExcel, exportToPdf } from '../lib/exportTable';
import { fetchAllBlanks, fetchOperations, ApiError } from '../lib/api';

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-06-02');
  const [level, setLevel] = useState<ReportLevel>('all');
  const [report, setReport] = useState<ReportResult | null>(null);
  const [generating, setGenerating] = useState(false);

  const canGenerate = useMemo(
    () => Boolean(reportType) && Boolean(dateFrom) && Boolean(dateTo) && dateFrom <= dateTo,
    [reportType, dateFrom, dateTo],
  );

  const handleGenerate = async () => {
    if (!reportType) {
      toast.error('Выберите тип отчёта');
      return;
    }
    if (!dateFrom || !dateTo) {
      toast.error('Укажите период');
      return;
    }
    if (dateFrom > dateTo) {
      toast.error('Дата начала позже даты окончания');
      return;
    }
    setGenerating(true);
    try {
      // buildReport сам фильтрует операции по периоду (inPeriod) — передаём все.
      const [blanks, operations] = await Promise.all([fetchAllBlanks({}), fetchOperations({})]);
      const result = buildReport({ type: reportType, dateFrom, dateTo, level }, { blanks, operations });
      setReport(result);
      toast.success(`Отчёт сформирован: ${result.rows.length} записей`);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error('Не удалось выполнить операцию');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportExcel = () => {
    if (!report) {
      toast.error('Сначала сформируйте отчёт');
      return;
    }
    exportToExcel({ title: report.title, subtitle: report.subtitle }, report.columns, report.rows);
    toast.success('Отчёт выгружен в Excel');
  };

  const handleExportPdf = () => {
    if (!report) {
      toast.error('Сначала сформируйте отчёт');
      return;
    }
    exportToPdf({ title: report.title, subtitle: report.subtitle }, report.columns, report.rows);
    toast.success('Открыто окно печати — сохраните как PDF');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Отчёты</h2>
        <p className="text-gray-600">Формирование отчётности по бланкам</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Параметры отчёта</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="report-type">Тип отчёта</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Выберите тип отчёта" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(reportTypeNames) as ReportType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {reportTypeNames[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date-from">Период с</Label>
              <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Период по</Label>
              <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Уровень</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as ReportLevel)}>
              <SelectTrigger id="level">
                <SelectValue placeholder="Выберите уровень" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все уровни</SelectItem>
                <SelectItem value="center">Центр</SelectItem>
                <SelectItem value="district">Округа</SelectItem>
                <SelectItem value="subject">Субъекты</SelectItem>
                <SelectItem value="vkmo">ВК МО</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="flex-1 min-w-48" onClick={handleGenerate} disabled={!canGenerate || generating}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {generating ? 'Загрузка…' : 'Сформировать отчёт'}
            </Button>
            <Button variant="outline" onClick={handleExportExcel} disabled={!report}>
              <Download className="mr-2 h-4 w-4" />
              Экспорт в Excel
            </Button>
            <Button variant="outline" onClick={handleExportPdf} disabled={!report}>
              <FileText className="mr-2 h-4 w-4" />
              Экспорт в PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Предварительный просмотр</CardTitle>
          {report && <p className="text-sm text-gray-600">{report.subtitle} · записей: {report.rows.length}</p>}
        </CardHeader>
        <CardContent>
          {!report ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Выберите параметры и нажмите «Сформировать отчёт»</p>
            </div>
          ) : report.rows.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-600">За выбранный период данные не найдены</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {report.columns.map((c) => (
                      <TableHead key={c.key}>{c.title}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.map((row, i) => (
                    <TableRow key={i}>
                      {report.columns.map((c) => (
                        <TableCell key={c.key}>{row[c.key]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
