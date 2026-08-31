export const greetingForHour = (hour: number) =>
  hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

export const currentGreeting = () => greetingForHour(new Date().getHours());
