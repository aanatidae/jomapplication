-- Expand the existing bounded snapshots to WGS84, preserving legacy demo rows,
-- ownership/RLS, verification guards, photo policies and expiry behavior.
begin;
create or replace function public.valid_geographic_point(value jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
  return coalesce(jsonb_typeof(value) = 'array' and jsonb_array_length(value) = 2
    and jsonb_typeof(value->0) = 'number' and jsonb_typeof(value->1) = 'number'
    and (value->>0)::numeric between -180 and 180 and (value->>1)::numeric between -90 and 90, false);
exception when others then return false;
end $$;

create or replace function public.valid_shared_path(value jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare point jsonb;
begin
  if not coalesce(jsonb_typeof(value) = 'object' and value->>'coordinateSystem' in ('schematic_demo', 'WGS84')
    and jsonb_typeof(value->'id') = 'string' and char_length(value->>'id') between 1 and 200
    and jsonb_typeof(value->'label') = 'string' and char_length(value->>'label') between 1 and 300
    and jsonb_typeof(value->'origin') = 'string' and char_length(value->>'origin') between 1 and 300
    and jsonb_typeof(value->'destination') = 'string' and char_length(value->>'destination') between 1 and 300
    and jsonb_typeof(value->'distanceM') = 'number' and (value->>'distanceM')::numeric between 0 and 10000000
    and jsonb_typeof(value->'durationMinutes') = 'number' and (value->>'durationMinutes')::numeric between 0 and 1440
    and jsonb_typeof(value->'geometry') = 'array' and jsonb_array_length(value->'geometry') between 2 and 1000
    and pg_column_size(value) <= 65536, false) then return false; end if;
  for point in select jsonb_array_elements(value->'geometry') loop
    if value->>'coordinateSystem' = 'WGS84' then
      if not public.valid_geographic_point(point) then return false; end if;
    elsif not public.valid_demo_point(point) then return false; end if;
  end loop;
  return true;
exception when others then return false;
end $$;

create or replace function public.valid_report_location(value jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
  return coalesce(jsonb_typeof(value) = 'object' and value->>'coordinateSystem' in ('schematic_demo', 'WGS84')
    and jsonb_typeof(value->'label') = 'string' and char_length(value->>'label') between 1 and 500
    and case when value->>'coordinateSystem' = 'WGS84' then public.valid_geographic_point(value->'point')
      else public.valid_demo_point(value->'point') end
    and pg_column_size(value) <= 4096
    and (not (value ? 'routeId') or (jsonb_typeof(value->'routeId') = 'string' and char_length(value->>'routeId') between 1 and 200))
    and (not (value ? 'waypointIndex') or (jsonb_typeof(value->'waypointIndex') = 'number' and (value->>'waypointIndex')::numeric between 0 and 999 and (value->>'waypointIndex')::numeric = trunc((value->>'waypointIndex')::numeric))), false);
exception when others then return false;
end $$;
commit;
