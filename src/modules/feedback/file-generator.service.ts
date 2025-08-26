import { Injectable } from '@nestjs/common';
import { parse } from 'json2csv';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { FeedbackSchemaType } from 'src/utils/zod.schemas';
import type {
  FeedbackSummaryResponseDto,
  ReportDownloadQueryDto,
} from './dto/feedback.dto';

@Injectable()
export class FileGeneratorService {
  async generate(
    format: ReportDownloadQueryDto['format'],
    type: ReportDownloadQueryDto['type'],
    data: FeedbackSchemaType[] | FeedbackSummaryResponseDto,
  ): Promise<Buffer> {
    if (format === 'csv') {
      return this.generateCSV(data, type);
    }
    return this.generatePDF(data, type);
  }

  private async generateCSV(
    data: FeedbackSchemaType[] | FeedbackSummaryResponseDto,
    type: ReportDownloadQueryDto['type'],
  ): Promise<Buffer> {
    const delimiter = '   ';
    const quote = false;

    const toCSV = (rows: object[], fields: string[]) =>
      parse(rows, { fields, delimiter, quote });

    let csv: string;

    if (type === 'detailed') {
      const detailedData = (data as FeedbackSchemaType[]).map((f) => ({
        Feedback: f.content,
        Sentiment: f.sentiment,
        Confidence: f.confidence,
      }));
      csv = toCSV(detailedData, ['Feedback', 'Sentiment', 'Confidence']);
    } else {
      const summaryArray = data as FeedbackSummaryResponseDto;
      const summaryData = summaryArray.map((f) => ({
        Sentiment: f.sentiment,
        Count: f.count,
        Percentage: `${f.percentage.toFixed(1)}%`,
      }));
      csv = toCSV(summaryData, ['Sentiment', 'Count', 'Percentage']);
    }

    return Buffer.from(csv, 'utf-8');
  }

  private async generatePDF(
    data: FeedbackSchemaType[] | FeedbackSummaryResponseDto,
    type: ReportDownloadQueryDto['type'],
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let yPos = 800;
    const fontSizeTitle = 18;
    const fontSizeHeader = 12;
    const fontSizeRow = 10;

    const drawText = (text: string, x: number, y: number, size = fontSizeRow) =>
      page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });

    // Title
    drawText(`Feedback ${type} Report`, 50, yPos, fontSizeTitle);
    yPos -= 30;

    if (type === 'detailed') {
      // Headers
      drawText('Feedback', 50, yPos, fontSizeHeader);
      drawText('Sentiment', 300, yPos, fontSizeHeader);
      drawText('Confidence', 450, yPos, fontSizeHeader);
      yPos -= 20;

      // Rows
      data.forEach((f) => {
        drawText(f.content.slice(0, 40), 50, yPos);
        drawText(f.sentiment, 300, yPos);
        drawText(f.confidence.toString(), 450, yPos);
        yPos -= 15;
      });
    } else if (type === 'summary') {
      // Summary case
      const summaryArray = data as FeedbackSummaryResponseDto;
      const total = summaryArray.reduce((sum, f) => sum + f.count, 0);

      // Headers
      drawText('Sentiment', 50, yPos, fontSizeHeader);
      drawText('Count', 200, yPos, fontSizeHeader);
      drawText('Percentage', 300, yPos, fontSizeHeader);
      yPos -= 20;

      summaryArray.forEach((f) => {
        drawText(f.sentiment, 50, yPos);
        drawText(f.count.toString(), 200, yPos);
        drawText(`${f.percentage.toFixed(1)}%`, 300, yPos);
        yPos -= 15;
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
