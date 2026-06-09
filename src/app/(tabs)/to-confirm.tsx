import { EventTabList } from "../../components/EventTabList";

export default function ToConfirmScreen() {
  return (
    <EventTabList
      tab="to_confirm"
      title="To confirm"
      empty="Nothing waiting on you. Nice and calm."
    />
  );
}
