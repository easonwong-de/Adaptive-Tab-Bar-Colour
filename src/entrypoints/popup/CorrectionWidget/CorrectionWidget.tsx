import Icon from "@/components/Icon/Icon";
import styles from "./correction.widget.module.css";

export default function CorrectionWidget() {
	return (
		<section className={styles.correctionWidget}>
			<Icon type="contrast" />
			{i18n.t("colourIsAdjusted")}
		</section>
	);
}
