import { EventTabList } from "../../components/EventTabList";

export default function HistoryScreen() {
  return (
    <EventTabList
      tab="history"
      title="History"
      empty="Your meetup history appears after the first one."
    />
  );
}
