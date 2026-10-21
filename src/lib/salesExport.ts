import type { SalesPeriod, SalesReport } from "@/lib/api";

const PERIOD_FILE: Record<SalesPeriod, string> = {
  today: "hoje",
  yesterday: "ontem",
  week: "7-dias",
  month: "30-dias",
};

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Dinheiro",
  CARD: "Cartão",
  OTHER: "Outro",
};

const FULFILLMENT_LABEL: Record<string, string> = {
  PICKUP: "Retirada",
  DELIVERY: "Entrega",
};

const STATUS_LABEL: Record<string, string> = {
  SENT: "Enviado",
  IN_PROGRESS: "Preparando",
  READY: "Pronto",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cellString(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  return `<Cell><Data ss:Type="String">${escapeXml(text)}</Data></Cell>`;
}

function cellNumber(value: number): string {
  return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
}

/** BRL as decimal number for Excel (not cents). */
function cellMoney(cents: number): string {
  return cellNumber(Number((cents / 100).toFixed(2)));
}

function row(cells: string[]): string {
  return `<Row>${cells.join("")}</Row>`;
}

function sheet(name: string, rows: string[]): string {
  return `<Worksheet ss:Name="${escapeXml(name)}"><Table>${rows.join("")}</Table></Worksheet>`;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildWorkbookXml(report: SalesReport, period: SalesPeriod): string {
  const periodLabel = PERIOD_FILE[period] || period;
  const kpis = report.kpis;

  const resumo = [
    row([cellString("Período"), cellString(periodLabel)]),
    row([cellString("De"), cellString(formatWhen(report.from))]),
    row([cellString("Até"), cellString(formatWhen(report.to))]),
    row([cellString("Fuso"), cellString(report.timezone)]),
    row([cellString(""), cellString("")]),
    row([cellString("Indicador"), cellString("Valor")]),
    row([cellString("Faturamento (R$)"), cellMoney(kpis.grossSalesCents)]),
    row([cellString("Pedidos"), cellNumber(kpis.orderCount)]),
    row([cellString("Ticket médio (R$)"), cellMoney(kpis.averageTicketCents)]),
    row([cellString("Cancelamentos"), cellNumber(kpis.cancelledCount)]),
    row([
      cellString("Taxa de cancelamento (%)"),
      cellNumber(Number((kpis.cancelRate * 100).toFixed(2))),
    ]),
    row([cellString("Taxas de entrega (R$)"), cellMoney(kpis.deliveryFeeCents)]),
  ];

  const evolucao = [
    row([
      cellString("Faixa"),
      cellString("Pedidos"),
      cellString("Faturamento (R$)"),
    ]),
    ...report.series.map((s) =>
      row([cellString(s.label), cellNumber(s.orderCount), cellMoney(s.totalCents)])
    ),
  ];

  const pagamento = [
    row([
      cellString("Pagamento"),
      cellString("Pedidos"),
      cellString("Total (R$)"),
    ]),
    ...report.byPayment.map((r) =>
      row([
        cellString(PAYMENT_LABEL[r.key] || r.key),
        cellNumber(r.orderCount),
        cellMoney(r.totalCents),
      ])
    ),
  ];

  const fulfillment = [
    row([
      cellString("Tipo"),
      cellString("Pedidos"),
      cellString("Total (R$)"),
    ]),
    ...report.byFulfillment.map((r) =>
      row([
        cellString(FULFILLMENT_LABEL[r.key] || r.key),
        cellNumber(r.orderCount),
        cellMoney(r.totalCents),
      ])
    ),
  ];

  const status = [
    row([
      cellString("Status"),
      cellString("Pedidos"),
      cellString("Total (R$)"),
    ]),
    ...report.byStatus.map((r) =>
      row([
        cellString(STATUS_LABEL[r.key] || r.key),
        cellNumber(r.orderCount),
        cellMoney(r.totalCents),
      ])
    ),
  ];

  const topItens = [
    row([
      cellString("Item"),
      cellString("Quantidade"),
      cellString("Receita (R$)"),
    ]),
    ...report.topItems.map((item) =>
      row([
        cellString(item.name),
        cellNumber(item.qty),
        cellMoney(item.revenueCents),
      ])
    ),
  ];

  const recentes = [
    row([
      cellString("Horário"),
      cellString("Cliente"),
      cellString("Status"),
      cellString("Pagamento"),
      cellString("Tipo"),
      cellString("Itens"),
      cellString("Total (R$)"),
    ]),
    ...report.recentOrders.map((o) =>
      row([
        cellString(formatWhen(o.sentAt || o.createdAt)),
        cellString(o.customerName || "Cliente"),
        cellString(STATUS_LABEL[o.status] || o.status),
        cellString(PAYMENT_LABEL[o.paymentMethod] || o.paymentMethod),
        cellString(
          FULFILLMENT_LABEL[o.fulfillment || ""] || o.fulfillment || "Retirada"
        ),
        cellString(o.linesSummary || ""),
        cellMoney(o.totalCents),
      ])
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheet("Resumo", resumo)}
${sheet("Evolucao", evolucao)}
${sheet("Pagamento", pagamento)}
${sheet("Retirada_Entrega", fulfillment)}
${sheet("Status", status)}
${sheet("Top_itens", topItens)}
${sheet("Pedidos_recentes", recentes)}
</Workbook>`;
}

/** Download current sales report as an Excel-compatible .xls workbook. */
export function downloadSalesExcel(
  report: SalesReport,
  period: SalesPeriod
): void {
  const xml = buildWorkbookXml(report, period);
  const blob = new Blob([xml], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const stamp = new Date()
    .toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    .replace(/\//g, "-");
  const filename = `vendas-${PERIOD_FILE[period] || period}-${stamp}.xls`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
