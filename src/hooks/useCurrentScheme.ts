export default function useCurrentScheme(): Scheme {
	const [scheme, setScheme] = useState<Scheme>(getSystemScheme());

	useEffect(() => {
		getCurrentScheme().then(setScheme);
		addSchemeChangeListener(setScheme);
	}, []);

	return scheme;
}
