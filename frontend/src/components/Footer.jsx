export default function Footer() {
    return (
        <footer style={{
            width: '100%',
            padding: '24px 0',
            textAlign: 'center',
            fontSize: '13px',
            opacity: 0.6,
            marginTop: 'auto',
            borderTop: '1px solid var(--border, #27272a)'
        }}>
            <p style={{ margin: 0 }}>
                © {new Date().getFullYear()} <strong>ScioperiFacili</strong> — Tutti i diritti riservati.
            </p>
        </footer>
    );
}