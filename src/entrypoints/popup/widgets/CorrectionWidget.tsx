import styles from "./CorrectionWidget.module.css";

export default function CorrectionWidget() {
	return (
		<section className={styles.correctionWidget}>
			<Icon type="contrast" />
			{i18n.t("colourIsAdjusted")}
		</section>
	);
}
