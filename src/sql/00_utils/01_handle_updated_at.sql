-- A reusable function to automatically update the `updated_at` timestamp on a table.
create or replace function handle_updated_at() 
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new; 
end;
$$ language plpgsql;
