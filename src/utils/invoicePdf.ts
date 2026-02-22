import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Invoice, InvoiceItem, Customer } from '@/types/models'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function exportInvoicePdf(
  item: Invoice,
  customer: Customer | undefined,
  lineItems: InvoiceItem[],
  logoSrc: string,
): Promise<void> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Logo
  let headerBottom = 40
  try {
    const logoImg = await loadImage(logoSrc)
    const logoHeight = 14
    const logoWidth = (logoImg.width / logoImg.height) * logoHeight
    doc.addImage(logoImg, 'PNG', 14, 10, logoWidth, logoHeight)
    headerBottom = 28
  } catch {
    // If logo fails to load, fall back to text header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bolditalic')
    doc.text('Esso Coffeehouse', 14, 22)
    headerBottom = 28
  }

  // Business address
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('4700 N 12th St #107', 14, headerBottom)
  doc.text('Phoenix, AZ 85014', 14, headerBottom + 5)
  doc.text('Phone: 480.560.3067', 14, headerBottom + 10)

  // Invoice number
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(`INVOICE # ${item.invoice_number}`, pageWidth - 14, 18, { align: 'right' })

  // Bill To
  let billY = headerBottom + 22
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bolditalic')
  doc.text('BILL TO:', 14, billY)
  doc.setFont('helvetica', 'normal')
  if (customer) {
    doc.text(customer.name, 44, billY)
    if (customer.address) {
      billY += 5
      doc.text(customer.address, 44, billY)
    }
    const cityLine = [customer.city, customer.state].filter(Boolean).join(', ')
    const fullLine = [cityLine, customer.zip_code].filter(Boolean).join(' ')
    if (fullLine) {
      billY += 5
      doc.text(fullLine, 44, billY)
    }
  }

  // Line items table
  const tableY = billY + 12
  autoTable(doc, {
    startY: tableY,
    head: [[
      'DATE OF SERVICE',
      'DESCRIPTION',
      'PRICE',
      'QUANTITY',
      'AMOUNT',
    ]],
    body: lineItems.map((li) => [
      li.date_of_service ? formatDate(li.date_of_service) : '',
      li.description,
      formatCurrency(li.price_per_unit),
      String(li.quantity),
      li.amount != null ? formatCurrency(li.amount) : '',
    ]),
    headStyles: {
      fillColor: [187, 212, 238],
      textColor: [0, 0, 0],
      fontStyle: 'bolditalic',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
    theme: 'grid',
  })

  // Totals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 10
  const totalsX = pageWidth - 14

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bolditalic')
  doc.text('SUBTOTAL', totalsX - 35, finalY, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(item.subtotal != null ? formatCurrency(item.subtotal) : '$0.00', totalsX, finalY, { align: 'right' })

  doc.line(totalsX - 70, finalY + 3, totalsX, finalY + 3)

  doc.setFont('helvetica', 'bolditalic')
  doc.text('BALANCE', totalsX - 35, finalY + 10, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.text(item.subtotal != null ? formatCurrency(item.subtotal) : '$0.00', totalsX, finalY + 10, { align: 'right' })

  const customerSlug = customer ? customer.name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase() : 'unknown'
  doc.save(`invoice_${item.invoice_number}_${customerSlug}.pdf`)
}
