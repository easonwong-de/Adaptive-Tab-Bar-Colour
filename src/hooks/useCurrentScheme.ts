/** A custom React hook that tracks and returns the current colour scheme. */
export default function useCurrentScheme(): Scheme {
	const [scheme, setScheme] = useState<Scheme>(getSystemScheme());

	useEffect(() => {
		getCurrentScheme().then(setScheme);
		addSchemeChangeListener(setScheme);
	}, []);

	return scheme;
}
