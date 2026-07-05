interface CsvPreviewProps {
  headers: string[];
  sampleRows: string[][];
}

export function CsvPreview({ headers, sampleRows }: CsvPreviewProps) {
  return (
    <div className="glass-panel csv-preview">
      <table className="transaction-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sampleRows.slice(0, 5).map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
