create table
  public.admins (
    user_id uuid not null,
    is_super boolean not null default false,
    constraint admins_pkey primary key (user_id),
    constraint admins_user_id_fkey foreign key (user_id) references auth.users (id) on update cascade on delete cascade
  ) tablespace pg_default;