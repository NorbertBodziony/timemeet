import { EventTabList } from "../../components/EventTabList";
import { useT } from "../../providers/LanguageProvider";

export default function ToConfirmScreen() {
  const { t } = useT();
  return (
    <EventTabList
      tab="to_confirm"
      title={t("tabs.toConfirm")}
      empty={t("tabs.toConfirm.empty")}
      emptyIcon="mail-open-outline"
    />
  );
}
