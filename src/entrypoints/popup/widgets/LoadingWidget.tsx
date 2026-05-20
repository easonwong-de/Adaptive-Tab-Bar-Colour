import styles from "./LoadingWidget.module.css";

export default function LoadingWidget() {
	return (
		<section className={styles.loadingWidget}>
			<div className={styles.loadingMessage}>
				<Icon type="info" inline />
				<span>{i18n.t("loading")}</span>
			</div>
		</section>
	);
}
