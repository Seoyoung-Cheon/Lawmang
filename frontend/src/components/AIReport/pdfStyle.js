export const pdfStyles = {
  container: {
    margin: '2rem 0',
    padding: '2rem',
    backgroundColor: 'white',
    maxWidth: '800px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
  },
  info: {
    color: '#666',
    marginBottom: '1rem',
  },
  content: {
    whiteSpace: 'pre-line',
    lineHeight: '1.5',
  }
};

export const downloadPDFConfig = {
  margin: 10,
  canvasOptions: {
    scale: 2,
    useCORS: true,
    logging: false,
  }
};