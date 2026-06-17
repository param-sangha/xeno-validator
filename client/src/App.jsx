import { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert('Choose a CSV file first');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('https://xeno-validator-0v2d.onrender.com', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  const download = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Transaction Data Validator</h2>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={loading} style={{ marginLeft: 10 }}>
        {loading ? 'Validating...' : 'Validate'}
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <p>Total rows: {result.totalRows}</p>
          <p>Valid: {result.validCount}</p>
          <p>Invalid: {result.invalidCount}</p>

          <button onClick={() => download(result.cleanedCSV, 'cleaned.csv')}>
            Download Cleaned CSV
          </button>

          {result.chunks.map((c) => (
            <button
              key={c.index}
              onClick={() => download(c.csv, `chunk_${c.index}.csv`)}
              style={{ marginLeft: 10 }}
            >
              Download Chunk {c.index}
            </button>
          ))}

          <h3 style={{ marginTop: 30 }}>Errors</h3>
          {result.invalidRows.length === 0 ? (
            <p>No errors 🎉</p>
          ) : (
            <ul>
              {result.invalidRows.map((r) => (
                <li key={r.rowNumber} style={{ marginBottom: 10 }}>
                  Row {r.rowNumber}: {r.errors.join(', ')}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default App;