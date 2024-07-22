create table
  public.users (
    user_id uuid not null,
    full_name character varying not null,
    trial_end_at timestamp with time zone null,
    created_at timestamp with time zone null,
    profile_picture_src text null,
    email text null,
    constraint users_pkey primary key (user_id),
    constraint users_email_key unique (email),
    constraint users_user_id_fkey foreign key (user_id) references auth.users (id) on update cascade on delete cascade
  ) tablespace pg_default;


create table
  public.admins (
    user_id uuid not null,
    is_super boolean not null default false,
    constraint admins_pkey primary key (user_id),
    constraint admins_user_id_fkey foreign key (user_id) references auth.users (id) on update cascade on delete cascade
  ) tablespace pg_default;


create table
  public.stripe_customers (
    "stripe_id" text not null,
    created_at timestamp with time zone not null default now(),
    user_id uuid not null,
    constraint stripe_customers_pkey primary key ("stripe_id"),
    constraint stripe_customers_user_id_key unique (user_id)
  ) tablespace pg_default;



create table
  public.stripe_prices (
    stripe_id text not null,
    created_at timestamp with time zone not null default now(),
    active boolean not null default true,
    price_in_cents smallint not null,
    constraint stripe_prices_pkey primary key (stripe_id)
  ) tablespace pg_default;



create table
  public.stripe_subscriptions (
    stripe_id text not null,
    created_at timestamp with time zone not null default now(),
    user_id uuid not null default auth.uid (),
    stripe_price_id text not null,
    canceled_at timestamp with time zone null,
    stripe_customer_id text not null,
    deleted_at timestamp with time zone null,
    cancel_at_period_end boolean not null default false,
    next_payment_at timestamp with time zone null,
    last_payment_at timestamp with time zone null,
    subscription_start_at timestamp with time zone null default now(),
    subscription_end_at timestamp with time zone null,
    latest_period_start_at timestamp with time zone null,
    latest_period_end_at timestamp with time zone null,
    constraint stripe_subscriptions_pkey primary key (stripe_id),
    constraint stripe_subscriptions_stripe_customer_id_key unique (stripe_customer_id),
    constraint stripe_subscriptions_user_id_key unique (user_id),
    constraint stripe_subscriptions_stripe_customer_id_fkey foreign key (stripe_customer_id) references stripe_customers ("stripe_id") on update cascade on delete cascade,
    constraint stripe_subscriptions_user_id_fkey foreign key (user_id) references users (user_id) on update cascade on delete cascade
  ) tablespace pg_default;



alter table public.users enable row level security;

CREATE POLICY "admins can manage the whole table" ON "public"."users"
AS PERMISSIVE FOR ALL
TO authenticated
USING ((EXISTS ( SELECT true FROM admins WHERE (admins.user_id = auth.uid()))))
WITH CHECK ((EXISTS ( SELECT true FROM admins WHERE (admins.user_id = auth.uid()))));

CREATE POLICY "Users can manage their own rows" ON "public"."users"
AS PERMISSIVE FOR ALL
TO authenticated
USING ((user_id = auth.uid()))
WITH CHECK ((user_id = auth.uid()));

alter table public.admins enable row level security;

CREATE POLICY "users can select their own row" ON "public"."admins"
AS PERMISSIVE FOR SELECT
TO authenticated
USING ((user_id = auth.uid()));

alter table public.stripe_customers enable row level security;

CREATE POLICY "users can select their own row" ON "public"."stripe_customers"
AS PERMISSIVE FOR SELECT
TO authenticated
USING ((user_id = auth.uid()));

alter table public.stripe_prices enable row level security;

CREATE POLICY "users can select all rows" ON "public"."stripe_prices"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

alter table public.stripe_subscriptions enable row level security;

CREATE POLICY "users can select their rows" ON "public"."stripe_subscriptions"
AS PERMISSIVE FOR SELECT
TO authenticated
USING ((user_id = auth.uid()));


CREATE VIEW
  public.users_public AS
SELECT
  user_id, 
  full_name, 
  profile_picture_src
FROM
  public.users;