import { EventTabList } from "../../components/EventTabList";
import { useT } from "../../providers/LanguageProvider";

export default function HistoryScreen() {
  const { t } = useT();
  return (
    <EventTabList
      tab="history"
      title={t("tabs.history.title")}
      empty={t("tabs.history.empty")}
      emptyIcon="time-outline"
    />
  );
}
