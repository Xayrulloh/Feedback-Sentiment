import { Injectable } from '@nestjs/common';
import { FeedbackSchemaType } from 'src/utils/zod.schemas';
import { parse } from 'json2csv';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { FeedbackGetSummaryResponseDto, FeedbackSummaryEventDto, ReportDownloadRequestDto } from './dto/feedback.dto';

@Injectable()
export class FileGeneratorService {
  async generate(format: ReportDownloadRequestDto['format'], type: ReportDownloadRequestDto['type'], data: FeedbackSchemaType[] | FeedbackGetSummaryResponseDto): Promise<Buffer> {
    if (format === 'csv') {
      return this.generateCSV(data, type);
    }
    return this.generatePDF(data, type);
  }

 private async generateCSV(
  data: FeedbackSchemaType[] | Record<string, any>,
  type: ReportDownloadRequestDto['type']
): Promise<Buffer> {
  let csv: string;

  if (type === 'detailed') {
    const detailedData = (data as FeedbackSchemaType[]).map(f => ({
      'Feedback': f.content,
      Sentiment: f.sentiment,
      Confidence: f.confidence
    }));

    csv = parse(detailedData, {
      fields: ['Feedback', 'Sentiment', 'Confidence'],
      delimiter: '   ',
      quote: false,
    });
  } else {
  const summaryArray = (data as FeedbackGetSummaryResponseDto).data;
  const total = summaryArray.reduce((sum, f) => sum + f.count, 0);

  const summaryData = summaryArray.map(f => ({
    Sentiment: f.sentiment,
    Count: f.count,
    Percentage: f.percentage.toFixed(2) + '%',
  }));

  csv = parse(summaryData, {
    fields: ['Sentiment', 'Count', 'Percentage'],
    delimiter: '   ',
    quote: false,
  });
}

  return Buffer.from(csv, 'utf-8');
}

 private async generatePDF(
  data: FeedbackSchemaType[] | FeedbackGetSummaryResponseDto,
  type: ReportDownloadRequestDto['type']
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let yPos = 800;
  const fontSizeTitle = 18;
  const fontSizeText = 12;

  // Title
  page.drawText(`Feedback ${type} Report`, {
    x: 50,
    y: yPos,
    size: fontSizeTitle,
    font,
    color: rgb(0, 0, 0),
  });
  yPos -= 30;

  if (type === 'detailed' && Array.isArray(data)) {
    // Detailed headers
    page.drawText('Feedback', { x: 50, y: yPos, size: fontSizeText, font });
    page.drawText('Sentiment', { x: 300, y: yPos, size: fontSizeText, font });
    page.drawText('Confidence', { x: 450, y: yPos, size: fontSizeText, font });
    yPos -= 20;

    data.forEach(f => {
      page.drawText(f.content.slice(0, 40), { x: 50, y: yPos, size: 10, font });
      page.drawText(f.sentiment, { x: 300, y: yPos, size: 10, font });
      page.drawText(f.confidence.toString(), { x: 450, y: yPos, size: 10, font });
      yPos -= 15;
    });

  } else if (!Array.isArray(data)) {
    // Summary case
    const summaryArray = data.data;
    const total = summaryArray.reduce((sum, f) => sum + f.count, 0);

    page.drawText('Sentiment', { x: 50, y: yPos, size: fontSizeText, font });
    page.drawText('Count', { x: 200, y: yPos, size: fontSizeText, font });
    page.drawText('Percentage', { x: 300, y: yPos, size: fontSizeText, font });
    yPos -= 20;

    summaryArray.forEach(f => {
      const percentage = total > 0 ? ((f.count / total) * 100).toFixed(2) + '%' : '0%';
      page.drawText(f.sentiment, { x: 50, y: yPos, size: 10, font });
      page.drawText(f.count.toString(), { x: 200, y: yPos, size: 10, font });
      page.drawText(percentage, { x: 300, y: yPos, size: 10, font });
      yPos -= 15;
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}


}
