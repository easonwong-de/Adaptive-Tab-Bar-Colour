import Icon from "@/components/Icon/Icon";
import styles from "./loading.widget.module.css";

export default function LoadingWidget() {
	return (
		<section className={styles.loadingWidget}>
			<div className={styles.loadingMessage}>
				<Icon type="info" />
				Loading
			</div>
		</section>
	);
}
