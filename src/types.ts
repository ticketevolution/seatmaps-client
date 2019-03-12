export interface TicketGroup {
  tevo_section_name: string;
  retail_price: number;
}

export interface NormalizedTicketGroup {
  section: string;
  zone?: string;
  price: number;
}
