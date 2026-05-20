import styles from "./CorrectionWidget.module.css";

export default function CorrectionWidget() {
	return (
		<section className={styles.correctionWidget}>
			<Icon type="contrast" inline />
			<span>{i18n.t("colourIsAdjusted")}</span>
		</section>
	);
}
