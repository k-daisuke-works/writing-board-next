--
-- PostgreSQL database dump
--

\restrict DIDkczPudpg9LLsJkbRPGLjIgAl1GqMXeBIO7tQmvKpm3hVyUIhSU4pfk2gA5jf

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: export_all_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.export_all_data() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  r record;
  t jsonb;
  result jsonb := '{}'::jsonb;
begin
  for r in
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  loop
    execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) from %I x', r.table_name) into t;
    result := result || jsonb_build_object(r.table_name, t);
  end loop;
  return result;
end $$;


ALTER FUNCTION public.export_all_data() OWNER TO postgres;

--
-- Name: jwt_org_key(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.jwt_org_key() RETURNS integer
    LANGUAGE sql STABLE
    AS $$ select nullif(auth.jwt()->>'organization_key','')::integer $$;


ALTER FUNCTION public.jwt_org_key() OWNER TO postgres;

--
-- Name: jwt_user_key(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.jwt_user_key() RETURNS integer
    LANGUAGE sql STABLE
    AS $$ SELECT nullif(auth.jwt()->>'user_key','')::integer $$;


ALTER FUNCTION public.jwt_user_key() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    organization_key integer NOT NULL,
    actor_user_key integer,
    actor_name text NOT NULL,
    action text NOT NULL,
    target text,
    detail jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendar_events (
    id bigint NOT NULL,
    organization_key text NOT NULL,
    title text NOT NULL,
    event_date date NOT NULL,
    note text,
    location text,
    scope text DEFAULT 'all'::text NOT NULL,
    department_id integer,
    source_schedule_id bigint,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.calendar_events OWNER TO postgres;

--
-- Name: calendar_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calendar_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calendar_events_id_seq OWNER TO postgres;

--
-- Name: calendar_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calendar_events_id_seq OWNED BY public.calendar_events.id;


--
-- Name: department_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_data (
    department_id integer NOT NULL,
    department_name text NOT NULL,
    organization_key integer NOT NULL
);


ALTER TABLE public.department_data OWNER TO postgres;

--
-- Name: department_data_department_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.department_data_department_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.department_data_department_id_seq OWNER TO postgres;

--
-- Name: department_data_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.department_data_department_id_seq OWNED BY public.department_data.department_id;


--
-- Name: dm_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dm_messages (
    message_id bigint NOT NULL,
    organization_key integer NOT NULL,
    pair_id bigint NOT NULL,
    sender_key integer NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone
);


ALTER TABLE public.dm_messages OWNER TO postgres;

--
-- Name: dm_messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dm_messages_message_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dm_messages_message_id_seq OWNER TO postgres;

--
-- Name: dm_messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dm_messages_message_id_seq OWNED BY public.dm_messages.message_id;


--
-- Name: dm_pairs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dm_pairs (
    pair_id bigint NOT NULL,
    organization_key integer NOT NULL,
    user_a integer NOT NULL,
    user_b integer NOT NULL,
    requested_by integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    disclosed_at timestamp with time zone,
    disclosed_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    responded_at timestamp with time zone,
    CONSTRAINT dm_pairs_check CHECK ((user_a < user_b)),
    CONSTRAINT dm_pairs_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'blocked'::text])))
);


ALTER TABLE public.dm_pairs OWNER TO postgres;

--
-- Name: dm_pairs_pair_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dm_pairs_pair_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dm_pairs_pair_id_seq OWNER TO postgres;

--
-- Name: dm_pairs_pair_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dm_pairs_pair_id_seq OWNED BY public.dm_pairs.pair_id;


--
-- Name: employment_type_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employment_type_data (
    employment_type_id integer NOT NULL,
    employment_type_name text NOT NULL,
    organization_key integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.employment_type_data OWNER TO postgres;

--
-- Name: employment_type_data_employment_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employment_type_data_employment_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employment_type_data_employment_type_id_seq OWNER TO postgres;

--
-- Name: employment_type_data_employment_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employment_type_data_employment_type_id_seq OWNED BY public.employment_type_data.employment_type_id;


--
-- Name: group_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_data (
    group_id integer NOT NULL,
    group_name text NOT NULL,
    organization_key integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.group_data OWNER TO postgres;

--
-- Name: group_data_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.group_data_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_data_group_id_seq OWNER TO postgres;

--
-- Name: group_data_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.group_data_group_id_seq OWNED BY public.group_data.group_id;


--
-- Name: job_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_data (
    job_id integer NOT NULL,
    job_name text NOT NULL,
    organization_key integer NOT NULL
);


ALTER TABLE public.job_data OWNER TO postgres;

--
-- Name: job_data_job_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_data_job_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_data_job_id_seq OWNER TO postgres;

--
-- Name: job_data_job_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_data_job_id_seq OWNED BY public.job_data.job_id;


--
-- Name: login_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_history (
    id bigint NOT NULL,
    user_key integer,
    organization_key integer NOT NULL,
    user_name_stamp text NOT NULL,
    logged_at timestamp with time zone DEFAULT now(),
    ip_address text
);


ALTER TABLE public.login_history OWNER TO postgres;

--
-- Name: login_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.login_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.login_history_id_seq OWNER TO postgres;

--
-- Name: login_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.login_history_id_seq OWNED BY public.login_history.id;


--
-- Name: organization_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_data (
    organization_key integer NOT NULL,
    organization_id text NOT NULL,
    organization_name text NOT NULL,
    organization_password text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.organization_data OWNER TO postgres;

--
-- Name: organization_data_organization_key_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organization_data_organization_key_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organization_data_organization_key_seq OWNER TO postgres;

--
-- Name: organization_data_organization_key_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organization_data_organization_key_seq OWNED BY public.organization_data.organization_key;


--
-- Name: password_policy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_policy (
    organization_key integer NOT NULL,
    min_length integer DEFAULT 8 NOT NULL,
    expiry_days integer
);


ALTER TABLE public.password_policy OWNER TO postgres;

--
-- Name: position_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.position_data (
    position_id integer NOT NULL,
    position_name text NOT NULL,
    organization_key integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.position_data OWNER TO postgres;

--
-- Name: position_data_position_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.position_data_position_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.position_data_position_id_seq OWNER TO postgres;

--
-- Name: position_data_position_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.position_data_position_id_seq OWNED BY public.position_data.position_id;


--
-- Name: post_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_attachments (
    id bigint NOT NULL,
    post_id bigint NOT NULL,
    organization_key integer NOT NULL,
    file_type text NOT NULL,
    url text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT post_attachments_file_type_check CHECK ((file_type = ANY (ARRAY['image'::text, 'video'::text, 'pdf'::text])))
);


ALTER TABLE public.post_attachments OWNER TO postgres;

--
-- Name: post_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_attachments_id_seq OWNER TO postgres;

--
-- Name: post_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_attachments_id_seq OWNED BY public.post_attachments.id;


--
-- Name: post_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_reactions (
    id bigint NOT NULL,
    post_id bigint NOT NULL,
    user_key integer NOT NULL,
    user_name text NOT NULL,
    organization_key integer NOT NULL,
    emoji text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.post_reactions REPLICA IDENTITY FULL;


ALTER TABLE public.post_reactions OWNER TO postgres;

--
-- Name: post_reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_reactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_reactions_id_seq OWNER TO postgres;

--
-- Name: post_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_reactions_id_seq OWNED BY public.post_reactions.id;


--
-- Name: post_reads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_reads (
    id bigint NOT NULL,
    post_id bigint NOT NULL,
    user_key integer NOT NULL,
    user_name text NOT NULL,
    organization_key integer NOT NULL,
    read_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.post_reads OWNER TO postgres;

--
-- Name: post_reads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_reads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_reads_id_seq OWNER TO postgres;

--
-- Name: post_reads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_reads_id_seq OWNED BY public.post_reads.id;


--
-- Name: post_replies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_replies (
    id bigint NOT NULL,
    post_id bigint NOT NULL,
    user_key integer NOT NULL,
    user_name_stamp text NOT NULL,
    organization_key integer NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.post_replies REPLICA IDENTITY FULL;


ALTER TABLE public.post_replies OWNER TO postgres;

--
-- Name: post_replies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_replies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_replies_id_seq OWNER TO postgres;

--
-- Name: post_replies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_replies_id_seq OWNED BY public.post_replies.id;


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.push_subscriptions (
    id bigint NOT NULL,
    user_key integer NOT NULL,
    organization_key integer NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.push_subscriptions OWNER TO postgres;

--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.push_subscriptions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.push_subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: schedule_dates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule_dates (
    date_id integer NOT NULL,
    event_id integer NOT NULL,
    candidate_dt timestamp with time zone NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.schedule_dates OWNER TO postgres;

--
-- Name: schedule_dates_date_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schedule_dates_date_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schedule_dates_date_id_seq OWNER TO postgres;

--
-- Name: schedule_dates_date_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schedule_dates_date_id_seq OWNED BY public.schedule_dates.date_id;


--
-- Name: schedule_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule_events (
    event_id integer NOT NULL,
    organization_key integer NOT NULL,
    created_by integer NOT NULL,
    created_by_name text NOT NULL,
    title text NOT NULL,
    description text,
    scope text NOT NULL,
    target_department_id integer,
    target_department_name text,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT schedule_events_scope_check CHECK ((scope = ANY (ARRAY['all_departments'::text, 'department'::text]))),
    CONSTRAINT schedule_events_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])))
);


ALTER TABLE public.schedule_events OWNER TO postgres;

--
-- Name: schedule_events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schedule_events_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schedule_events_event_id_seq OWNER TO postgres;

--
-- Name: schedule_events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schedule_events_event_id_seq OWNED BY public.schedule_events.event_id;


--
-- Name: schedule_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule_responses (
    response_id integer NOT NULL,
    event_id integer NOT NULL,
    date_id integer NOT NULL,
    respondent_type text NOT NULL,
    respondent_id integer NOT NULL,
    respondent_name text NOT NULL,
    answer text NOT NULL,
    answered_by integer NOT NULL,
    answered_at timestamp with time zone DEFAULT now(),
    CONSTRAINT schedule_responses_answer_check CHECK ((answer = ANY (ARRAY['ok'::text, 'maybe'::text, 'ng'::text]))),
    CONSTRAINT schedule_responses_respondent_type_check CHECK ((respondent_type = ANY (ARRAY['department'::text, 'user'::text])))
);


ALTER TABLE public.schedule_responses OWNER TO postgres;

--
-- Name: schedule_responses_response_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schedule_responses_response_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schedule_responses_response_id_seq OWNER TO postgres;

--
-- Name: schedule_responses_response_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schedule_responses_response_id_seq OWNED BY public.schedule_responses.response_id;


--
-- Name: user_group_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_group_members (
    user_key integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.user_group_members OWNER TO postgres;

--
-- Name: user_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_info (
    user_key integer NOT NULL,
    user_id text NOT NULL,
    user_name text NOT NULL,
    job_id integer,
    department_id integer,
    admin_flag boolean DEFAULT false,
    organization_key integer NOT NULL,
    password text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    profile text,
    affiliation text,
    avatar_url text,
    role text DEFAULT 'member'::text NOT NULL,
    must_change_password boolean DEFAULT false NOT NULL,
    position_id integer,
    employment_type_id integer,
    is_active boolean DEFAULT true NOT NULL,
    password_changed_at timestamp with time zone DEFAULT now(),
    email text,
    social_worker_member_id text,
    CONSTRAINT user_info_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'leader'::text, 'member'::text])))
);


ALTER TABLE public.user_info OWNER TO postgres;

--
-- Name: COLUMN user_info.email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_info.email IS '管理者のパスワード再設定用メールアドレス（管理者のみ設定、任意）';


--
-- Name: user_info_user_key_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_info_user_key_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_info_user_key_seq OWNER TO postgres;

--
-- Name: user_info_user_key_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_info_user_key_seq OWNED BY public.user_info.user_key;


--
-- Name: welfare_news; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.welfare_news (
    id integer NOT NULL,
    source_name text NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    published_at timestamp with time zone,
    fetched_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.welfare_news OWNER TO postgres;

--
-- Name: welfare_news_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.welfare_news_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.welfare_news_id_seq OWNER TO postgres;

--
-- Name: welfare_news_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.welfare_news_id_seq OWNED BY public.welfare_news.id;


--
-- Name: writing_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.writing_data (
    writing_id integer NOT NULL,
    user_key integer,
    job_id integer,
    department_id integer,
    organization_key integer NOT NULL,
    user_name_stamp text NOT NULL,
    job_name_stamp text,
    department_name_stamp text,
    pin text,
    message text NOT NULL,
    pdf_url text,
    writing_time timestamp with time zone DEFAULT now(),
    post_type text DEFAULT 'board'::text NOT NULL,
    image_url text,
    video_url text,
    is_important boolean DEFAULT false NOT NULL,
    display_until timestamp with time zone,
    title text
);

ALTER TABLE ONLY public.writing_data REPLICA IDENTITY FULL;


ALTER TABLE public.writing_data OWNER TO postgres;

--
-- Name: writing_data_writing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.writing_data_writing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.writing_data_writing_id_seq OWNER TO postgres;

--
-- Name: writing_data_writing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.writing_data_writing_id_seq OWNED BY public.writing_data.writing_id;


--
-- Name: calendar_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events ALTER COLUMN id SET DEFAULT nextval('public.calendar_events_id_seq'::regclass);


--
-- Name: department_data department_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_data ALTER COLUMN department_id SET DEFAULT nextval('public.department_data_department_id_seq'::regclass);


--
-- Name: dm_messages message_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_messages ALTER COLUMN message_id SET DEFAULT nextval('public.dm_messages_message_id_seq'::regclass);


--
-- Name: dm_pairs pair_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_pairs ALTER COLUMN pair_id SET DEFAULT nextval('public.dm_pairs_pair_id_seq'::regclass);


--
-- Name: employment_type_data employment_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_type_data ALTER COLUMN employment_type_id SET DEFAULT nextval('public.employment_type_data_employment_type_id_seq'::regclass);


--
-- Name: group_data group_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_data ALTER COLUMN group_id SET DEFAULT nextval('public.group_data_group_id_seq'::regclass);


--
-- Name: job_data job_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_data ALTER COLUMN job_id SET DEFAULT nextval('public.job_data_job_id_seq'::regclass);


--
-- Name: login_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_history ALTER COLUMN id SET DEFAULT nextval('public.login_history_id_seq'::regclass);


--
-- Name: organization_data organization_key; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_data ALTER COLUMN organization_key SET DEFAULT nextval('public.organization_data_organization_key_seq'::regclass);


--
-- Name: position_data position_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_data ALTER COLUMN position_id SET DEFAULT nextval('public.position_data_position_id_seq'::regclass);


--
-- Name: post_attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_attachments ALTER COLUMN id SET DEFAULT nextval('public.post_attachments_id_seq'::regclass);


--
-- Name: post_reactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_reactions ALTER COLUMN id SET DEFAULT nextval('public.post_reactions_id_seq'::regclass);


--
-- Name: post_reads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_reads ALTER COLUMN id SET DEFAULT nextval('public.post_reads_id_seq'::regclass);


--
-- Name: post_replies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_replies ALTER COLUMN id SET DEFAULT nextval('public.post_replies_id_seq'::regclass);


--
-- Name: schedule_dates date_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_dates ALTER COLUMN date_id SET DEFAULT nextval('public.schedule_dates_date_id_seq'::regclass);


--
-- Name: schedule_events event_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_events ALTER COLUMN event_id SET DEFAULT nextval('public.schedule_events_event_id_seq'::regclass);


--
-- Name: schedule_responses response_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_responses ALTER COLUMN response_id SET DEFAULT nextval('public.schedule_responses_response_id_seq'::regclass);


--
-- Name: user_info user_key; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_info ALTER COLUMN user_key SET DEFAULT nextval('public.user_info_user_key_seq'::regclass);


--
-- Name: welfare_news id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.welfare_news ALTER COLUMN id SET DEFAULT nextval('public.welfare_news_id_seq'::regclass);


--
-- Name: writing_data writing_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.writing_data ALTER COLUMN writing_id SET DEFAULT nextval('public.writing_data_writing_id_seq'::regclass);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: department_data department_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_data
    ADD CONSTRAINT department_data_pkey PRIMARY KEY (department_id);


--
-- Name: dm_messages dm_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_messages
    ADD CONSTRAINT dm_messages_pkey PRIMARY KEY (message_id);


--
-- Name: dm_pairs dm_pairs_organization_key_user_a_user_b_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_pairs
    ADD CONSTRAINT dm_pairs_organization_key_user_a_user_b_key UNIQUE (organization_key, user_a, user_b);


--
-- Name: dm_pairs dm_pairs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_pairs
    ADD CONSTRAINT dm_pairs_pkey PRIMARY KEY (pair_id);


--
-- Name: employment_type_data employment_type_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_type_data
    ADD CONSTRAINT employment_type_data_pkey PRIMARY KEY (employment_type_id);


--
-- Name: group_data group_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_data
    ADD CONSTRAINT group_data_pkey PRIMARY KEY (group_id);


--
-- Name: job_data job_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_data
    ADD CONSTRAINT job_data_pkey PRIMARY KEY (job_id);


--
-- Name: login_history login_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_history
    ADD CONSTRAINT login_history_pkey PRIMARY KEY (id);


--
-- Name: organization_data organization_data_organization_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_data
    ADD CONSTRAINT organization_data_organization_id_key UNIQUE (organization_id);


--
-- Name: organization_data organization_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_data
    ADD CONSTRAINT organization_data_pkey PRIMARY KEY (organization_key);


--
-- Name: password_policy password_policy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_policy
    ADD CONSTRAINT password_policy_pkey PRIMARY KEY (organization_key);


--
-- Name: position_data position_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_data
    ADD CONSTRAINT position_data_pkey PRIMARY KEY (position_id);


--
-- Name: post_attachments post_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_attachments
    ADD CONSTRAINT post_attachments_pkey PRIMARY KEY (id);


--
-- Name: post_reactions post_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_reactions
    ADD CONSTRAINT post_reactions_pkey PRIMARY KEY (id);


--
-- Name: post_reactions post_reactions_post_id_user_key_emoji_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_reactions
    ADD CONSTRAINT post_reactions_post_id_user_key_emoji_key UNIQUE (post_id, user_key, emoji);


--
-- Name: post_reads post_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_reads
    ADD CONSTRAINT post_reads_pkey PRIMARY KEY (id);


--
-- Name: post_reads post_reads_post_id_user_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_reads
    ADD CONSTRAINT post_reads_post_id_user_key_key UNIQUE (post_id, user_key);


--
-- Name: post_replies post_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_replies
    ADD CONSTRAINT post_replies_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: schedule_dates schedule_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_dates
    ADD CONSTRAINT schedule_dates_pkey PRIMARY KEY (date_id);


--
-- Name: schedule_events schedule_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_events
    ADD CONSTRAINT schedule_events_pkey PRIMARY KEY (event_id);


--
-- Name: schedule_responses schedule_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_responses
    ADD CONSTRAINT schedule_responses_pkey PRIMARY KEY (response_id);


--
-- Name: schedule_responses schedule_responses_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_responses
    ADD CONSTRAINT schedule_responses_unique UNIQUE (date_id, respondent_type, respondent_id);


--
-- Name: user_group_members user_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_group_members
    ADD CONSTRAINT user_group_members_pkey PRIMARY KEY (user_key, group_id);


--
-- Name: user_info user_info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_info
    ADD CONSTRAINT user_info_pkey PRIMARY KEY (user_key);


--
-- Name: user_info user_info_user_id_organization_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_info
    ADD CONSTRAINT user_info_user_id_organization_key_key UNIQUE (user_id, organization_key);


--
-- Name: welfare_news welfare_news_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.welfare_news
    ADD CONSTRAINT welfare_news_pkey PRIMARY KEY (id);


--
-- Name: welfare_news welfare_news_url_source; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.welfare_news
    ADD CONSTRAINT welfare_news_url_source UNIQUE (url, source_name);


--
-- Name: writing_data writing_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.writing_data
    ADD CONSTRAINT writing_data_pkey PRIMARY KEY (writing_id);


--
-- Name: idx_audit_logs_org_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_org_time ON public.audit_logs USING btree (organization_key, created_at DESC);


--
-- Name: idx_dm_messages_pair; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dm_messages_pair ON public.dm_messages USING btree (pair_id, created_at DESC);


--
-- Name: idx_dm_pairs_org_users; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dm_pairs_org_users ON public.dm_pairs USING btree (organization_key, user_a, user_b);


--
-- Name: post_attachments_organization_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX post_attachments_organization_key_idx ON public.post_attachments USING btree (organization_key);


--
-- Name: post_attachments_post_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX post_attachments_post_id_idx ON public.post_attachments USING btree (post_id);


--
-- Name: audit_logs audit_logs_organization_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_organization_key_fkey FOREIGN KEY (organization_key) REFERENCES public.organization_data(organization_key) ON DELETE CASCADE;


--
-- Name: department_data department_data_organization_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_data
    ADD CONSTRAINT department_data_organization_key_fkey FOREIGN KEY (organization_key) REFERENCES public.organization_data(organization_key) ON DELETE CASCADE;


--
-- Name: dm_messages dm_messages_organization_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_messages
    ADD CONSTRAINT dm_messages_organization_key_fkey FOREIGN KEY (organization_key) REFERENCES public.organization_data(organization_key) ON DELETE CASCADE;


--
-- Name: dm_messages dm_messages_pair_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_messages
    ADD CONSTRAINT dm_messages_pair_id_fkey FOREIGN KEY (pair_id) REFERENCES public.dm_pairs(pair_id) ON DELETE CASCADE;


--
-- Name: dm_pairs dm_pairs_organization_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_pairs
    ADD CONSTRAINT dm_pairs_organization_key_fkey FOREIGN KEY (organization_key) REFERENCES public.organization_data(organization_key) ON DELETE CASCADE;


--
-- Name: dm_pairs dm_pairs_user_a_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_pairs
    ADD CONSTRAINT dm_pairs_user_a_fkey FOREIGN KEY (user_a) REFERENCES public.user_info(user_key) ON DELETE CASCADE;


--
-- Name: dm_pairs dm_pairs_user_b_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_pairs
    ADD CONSTRAINT dm_pairs_user_b_fkey FOREIGN KEY (user_b) REFERENCES public.user_info(user_key) ON DELETE CASCADE;


--
-- Name: employment_type_data employment_type_data_organization_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_type_data
    ADD CONSTRAINT employment_type_data_organization_key_fkey FOREIGN KEY (organization_key) REFERENCES public.organization_data(organization_key) ON DELETE CASCADE;


--
-- Name: group_data group_data_organization_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_data
    ADD CONSTRAINT group_data_organization_key_fkey FOREIGN KEY (organization_key) REFERENCES public.organization_data(organization_key) ON DELETE CASCADE;


--
-- Name: job_data job_data_organization_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_data
    ADD CONSTRAINT job_data_organization_key_fkey FOREIGN KEY (organization_key) REFERENCES public.organization_data(organization_key) ON DELETE CASCADE;


--
-- Name: login_history login_history_user_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_history
    ADD CONSTRAINT login_history_user_key_fkey FOREIGN KEY (user_key) REFERENCES public.user_info(user_key) ON DELETE SET NULL;


--
-- Name: password_policy password_policy_organization_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_policy
    ADD CONSTRAINT password_policy_organization_key_fkey FOREIGN KEY (organization_key) REFERENCES public.organization_data(organization_key) ON DELETE CASCADE;


--
-- Name: position_data position_data_organization_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_data
    ADD CONSTRAINT position_data_organization_key_fkey FOREIGN KEY (organization_key) REFERENCES public.organization_data(organization_key) ON DELETE CASCADE;


--
-- Name: schedule_dates schedule_dates_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_dates
    ADD CONSTRAINT schedule_dates_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.schedule_events(event_id) ON DELETE CASCADE;


--
-- Name: schedule_responses schedule_responses_date_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_responses
    ADD CONSTRAINT schedule_responses_date_id_fkey FOREIGN KEY (date_id) REFERENCES public.schedule_dates(date_id) ON DELETE CASCADE;


--
-- Name: user_group_members user_group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_group_members
    ADD CONSTRAINT user_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.group_data(group_id) ON DELETE CASCADE;


--
-- Name: user_group_members user_group_members_user_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_group_members
    ADD CONSTRAINT user_group_members_user_key_fkey FOREIGN KEY (user_key) REFERENCES public.user_info(user_key) ON DELETE CASCADE;


--
-- Name: user_info user_info_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_info
    ADD CONSTRAINT user_info_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.department_data(department_id);


--
-- Name: user_info user_info_employment_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_info
    ADD CONSTRAINT user_info_employment_type_id_fkey FOREIGN KEY (employment_type_id) REFERENCES public.employment_type_data(employment_type_id) ON DELETE SET NULL;


--
-- Name: user_info user_info_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_info
    ADD CONSTRAINT user_info_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job_data(job_id);


--
-- Name: user_info user_info_organization_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_info
    ADD CONSTRAINT user_info_organization_key_fkey FOREIGN KEY (organization_key) REFERENCES public.organization_data(organization_key) ON DELETE CASCADE;


--
-- Name: user_info user_info_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_info
    ADD CONSTRAINT user_info_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.position_data(position_id) ON DELETE SET NULL;


--
-- Name: writing_data writing_data_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.writing_data
    ADD CONSTRAINT writing_data_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.department_data(department_id);


--
-- Name: writing_data writing_data_organization_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.writing_data
    ADD CONSTRAINT writing_data_organization_key_fkey FOREIGN KEY (organization_key) REFERENCES public.organization_data(organization_key) ON DELETE CASCADE;


--
-- Name: writing_data writing_data_user_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.writing_data
    ADD CONSTRAINT writing_data_user_key_fkey FOREIGN KEY (user_key) REFERENCES public.user_info(user_key) ON DELETE SET NULL;


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: welfare_news authenticated_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY authenticated_read ON public.welfare_news FOR SELECT TO authenticated USING (true);


--
-- Name: calendar_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

--
-- Name: department_data; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.department_data ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_pairs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.dm_pairs ENABLE ROW LEVEL SECURITY;

--
-- Name: employment_type_data; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.employment_type_data ENABLE ROW LEVEL SECURITY;

--
-- Name: group_data; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.group_data ENABLE ROW LEVEL SECURITY;

--
-- Name: job_data; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.job_data ENABLE ROW LEVEL SECURITY;

--
-- Name: login_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.audit_logs TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: calendar_events org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.calendar_events TO authenticated USING ((organization_key = ( SELECT (auth.jwt() ->> 'organization_key'::text)))) WITH CHECK ((organization_key = ( SELECT (auth.jwt() ->> 'organization_key'::text))));


--
-- Name: department_data org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.department_data TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: employment_type_data org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.employment_type_data TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: group_data org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.group_data TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: job_data org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.job_data TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: login_history org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.login_history TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: organization_data org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.organization_data TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: password_policy org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.password_policy TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: position_data org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.position_data TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: post_attachments org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.post_attachments TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: post_reactions org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.post_reactions TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: post_reads org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.post_reads TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: post_replies org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.post_replies TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: push_subscriptions org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.push_subscriptions TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: schedule_dates org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.schedule_dates TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.schedule_events e
  WHERE ((e.event_id = schedule_dates.event_id) AND (e.organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.schedule_events e
  WHERE ((e.event_id = schedule_dates.event_id) AND (e.organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))))));


--
-- Name: schedule_events org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.schedule_events TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: schedule_responses org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.schedule_responses TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.schedule_dates d
     JOIN public.schedule_events e ON ((e.event_id = d.event_id)))
  WHERE ((d.date_id = schedule_responses.date_id) AND (e.organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.schedule_dates d
     JOIN public.schedule_events e ON ((e.event_id = d.event_id)))
  WHERE ((d.date_id = schedule_responses.date_id) AND (e.organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))))));


--
-- Name: user_group_members org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.user_group_members TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.group_data g
  WHERE ((g.group_id = user_group_members.group_id) AND (g.organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.group_data g
  WHERE ((g.group_id = user_group_members.group_id) AND (g.organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))))));


--
-- Name: user_info org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.user_info TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: writing_data org_isolation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY org_isolation ON public.writing_data TO authenticated USING ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key))) WITH CHECK ((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)));


--
-- Name: organization_data; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_data ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_messages participant_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY participant_insert ON public.dm_messages FOR INSERT TO authenticated WITH CHECK (((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)) AND (sender_key = ( SELECT public.jwt_user_key() AS jwt_user_key)) AND (EXISTS ( SELECT 1
   FROM public.dm_pairs p
  WHERE ((p.pair_id = dm_messages.pair_id) AND (p.organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)) AND (p.status = 'accepted'::text) AND ((( SELECT public.jwt_user_key() AS jwt_user_key) = p.user_a) OR (( SELECT public.jwt_user_key() AS jwt_user_key) = p.user_b)))))));


--
-- Name: dm_pairs participant_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY participant_insert ON public.dm_pairs FOR INSERT TO authenticated WITH CHECK (((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)) AND ((( SELECT public.jwt_user_key() AS jwt_user_key) = user_a) OR (( SELECT public.jwt_user_key() AS jwt_user_key) = user_b)) AND (requested_by = ( SELECT public.jwt_user_key() AS jwt_user_key))));


--
-- Name: dm_messages participant_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY participant_select ON public.dm_messages FOR SELECT TO authenticated USING (((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)) AND (EXISTS ( SELECT 1
   FROM public.dm_pairs p
  WHERE ((p.pair_id = dm_messages.pair_id) AND (p.organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)) AND ((( SELECT public.jwt_user_key() AS jwt_user_key) = p.user_a) OR (( SELECT public.jwt_user_key() AS jwt_user_key) = p.user_b)))))));


--
-- Name: dm_pairs participant_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY participant_select ON public.dm_pairs FOR SELECT TO authenticated USING (((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)) AND ((( SELECT public.jwt_user_key() AS jwt_user_key) = user_a) OR (( SELECT public.jwt_user_key() AS jwt_user_key) = user_b))));


--
-- Name: dm_messages participant_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY participant_update ON public.dm_messages FOR UPDATE TO authenticated USING (((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)) AND (EXISTS ( SELECT 1
   FROM public.dm_pairs p
  WHERE ((p.pair_id = dm_messages.pair_id) AND (p.organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)) AND ((( SELECT public.jwt_user_key() AS jwt_user_key) = p.user_a) OR (( SELECT public.jwt_user_key() AS jwt_user_key) = p.user_b))))))) WITH CHECK (((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)) AND (EXISTS ( SELECT 1
   FROM public.dm_pairs p
  WHERE ((p.pair_id = dm_messages.pair_id) AND (p.organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)) AND ((( SELECT public.jwt_user_key() AS jwt_user_key) = p.user_a) OR (( SELECT public.jwt_user_key() AS jwt_user_key) = p.user_b)))))));


--
-- Name: dm_pairs participant_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY participant_update ON public.dm_pairs FOR UPDATE TO authenticated USING (((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)) AND ((( SELECT public.jwt_user_key() AS jwt_user_key) = user_a) OR (( SELECT public.jwt_user_key() AS jwt_user_key) = user_b)))) WITH CHECK (((organization_key = ( SELECT public.jwt_org_key() AS jwt_org_key)) AND ((( SELECT public.jwt_user_key() AS jwt_user_key) = user_a) OR (( SELECT public.jwt_user_key() AS jwt_user_key) = user_b))));


--
-- Name: password_policy; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.password_policy ENABLE ROW LEVEL SECURITY;

--
-- Name: position_data; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.position_data ENABLE ROW LEVEL SECURITY;

--
-- Name: post_attachments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: post_reactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

--
-- Name: post_reads; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.post_reads ENABLE ROW LEVEL SECURITY;

--
-- Name: post_replies; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.post_replies ENABLE ROW LEVEL SECURITY;

--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: schedule_dates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.schedule_dates ENABLE ROW LEVEL SECURITY;

--
-- Name: schedule_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;

--
-- Name: schedule_responses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.schedule_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: user_group_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_group_members ENABLE ROW LEVEL SECURITY;

--
-- Name: user_info; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_info ENABLE ROW LEVEL SECURITY;

--
-- Name: welfare_news; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.welfare_news ENABLE ROW LEVEL SECURITY;

--
-- Name: writing_data; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.writing_data ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION export_all_data(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.export_all_data() FROM PUBLIC;
GRANT ALL ON FUNCTION public.export_all_data() TO service_role;


--
-- Name: FUNCTION jwt_org_key(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.jwt_org_key() TO anon;
GRANT ALL ON FUNCTION public.jwt_org_key() TO authenticated;
GRANT ALL ON FUNCTION public.jwt_org_key() TO service_role;


--
-- Name: FUNCTION jwt_user_key(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.jwt_user_key() TO anon;
GRANT ALL ON FUNCTION public.jwt_user_key() TO authenticated;
GRANT ALL ON FUNCTION public.jwt_user_key() TO service_role;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.audit_logs TO anon;
GRANT ALL ON TABLE public.audit_logs TO authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;


--
-- Name: SEQUENCE audit_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.audit_logs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.audit_logs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.audit_logs_id_seq TO service_role;


--
-- Name: TABLE calendar_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.calendar_events TO anon;
GRANT ALL ON TABLE public.calendar_events TO authenticated;
GRANT ALL ON TABLE public.calendar_events TO service_role;


--
-- Name: SEQUENCE calendar_events_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.calendar_events_id_seq TO anon;
GRANT ALL ON SEQUENCE public.calendar_events_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.calendar_events_id_seq TO service_role;


--
-- Name: TABLE department_data; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.department_data TO anon;
GRANT ALL ON TABLE public.department_data TO authenticated;
GRANT ALL ON TABLE public.department_data TO service_role;


--
-- Name: SEQUENCE department_data_department_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.department_data_department_id_seq TO anon;
GRANT ALL ON SEQUENCE public.department_data_department_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.department_data_department_id_seq TO service_role;


--
-- Name: TABLE dm_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.dm_messages TO anon;
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.dm_messages TO authenticated;
GRANT ALL ON TABLE public.dm_messages TO service_role;


--
-- Name: COLUMN dm_messages.read_at; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(read_at) ON TABLE public.dm_messages TO authenticated;


--
-- Name: SEQUENCE dm_messages_message_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.dm_messages_message_id_seq TO anon;
GRANT ALL ON SEQUENCE public.dm_messages_message_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.dm_messages_message_id_seq TO service_role;


--
-- Name: TABLE dm_pairs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.dm_pairs TO anon;
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.dm_pairs TO authenticated;
GRANT ALL ON TABLE public.dm_pairs TO service_role;


--
-- Name: COLUMN dm_pairs.requested_by; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(requested_by) ON TABLE public.dm_pairs TO authenticated;


--
-- Name: COLUMN dm_pairs.status; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(status) ON TABLE public.dm_pairs TO authenticated;


--
-- Name: COLUMN dm_pairs.disclosed_at; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(disclosed_at) ON TABLE public.dm_pairs TO authenticated;


--
-- Name: COLUMN dm_pairs.disclosed_by; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(disclosed_by) ON TABLE public.dm_pairs TO authenticated;


--
-- Name: COLUMN dm_pairs.responded_at; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(responded_at) ON TABLE public.dm_pairs TO authenticated;


--
-- Name: SEQUENCE dm_pairs_pair_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.dm_pairs_pair_id_seq TO anon;
GRANT ALL ON SEQUENCE public.dm_pairs_pair_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.dm_pairs_pair_id_seq TO service_role;


--
-- Name: TABLE employment_type_data; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.employment_type_data TO anon;
GRANT ALL ON TABLE public.employment_type_data TO authenticated;
GRANT ALL ON TABLE public.employment_type_data TO service_role;


--
-- Name: SEQUENCE employment_type_data_employment_type_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.employment_type_data_employment_type_id_seq TO anon;
GRANT ALL ON SEQUENCE public.employment_type_data_employment_type_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.employment_type_data_employment_type_id_seq TO service_role;


--
-- Name: TABLE group_data; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.group_data TO anon;
GRANT ALL ON TABLE public.group_data TO authenticated;
GRANT ALL ON TABLE public.group_data TO service_role;


--
-- Name: SEQUENCE group_data_group_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.group_data_group_id_seq TO anon;
GRANT ALL ON SEQUENCE public.group_data_group_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.group_data_group_id_seq TO service_role;


--
-- Name: TABLE job_data; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.job_data TO anon;
GRANT ALL ON TABLE public.job_data TO authenticated;
GRANT ALL ON TABLE public.job_data TO service_role;


--
-- Name: SEQUENCE job_data_job_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.job_data_job_id_seq TO anon;
GRANT ALL ON SEQUENCE public.job_data_job_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.job_data_job_id_seq TO service_role;


--
-- Name: TABLE login_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.login_history TO anon;
GRANT ALL ON TABLE public.login_history TO authenticated;
GRANT ALL ON TABLE public.login_history TO service_role;


--
-- Name: SEQUENCE login_history_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.login_history_id_seq TO anon;
GRANT ALL ON SEQUENCE public.login_history_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.login_history_id_seq TO service_role;


--
-- Name: TABLE organization_data; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.organization_data TO anon;
GRANT ALL ON TABLE public.organization_data TO authenticated;
GRANT ALL ON TABLE public.organization_data TO service_role;


--
-- Name: SEQUENCE organization_data_organization_key_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.organization_data_organization_key_seq TO anon;
GRANT ALL ON SEQUENCE public.organization_data_organization_key_seq TO authenticated;
GRANT ALL ON SEQUENCE public.organization_data_organization_key_seq TO service_role;


--
-- Name: TABLE password_policy; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.password_policy TO anon;
GRANT ALL ON TABLE public.password_policy TO authenticated;
GRANT ALL ON TABLE public.password_policy TO service_role;


--
-- Name: TABLE position_data; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.position_data TO anon;
GRANT ALL ON TABLE public.position_data TO authenticated;
GRANT ALL ON TABLE public.position_data TO service_role;


--
-- Name: SEQUENCE position_data_position_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.position_data_position_id_seq TO anon;
GRANT ALL ON SEQUENCE public.position_data_position_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.position_data_position_id_seq TO service_role;


--
-- Name: TABLE post_attachments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.post_attachments TO anon;
GRANT ALL ON TABLE public.post_attachments TO authenticated;
GRANT ALL ON TABLE public.post_attachments TO service_role;


--
-- Name: SEQUENCE post_attachments_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.post_attachments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.post_attachments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.post_attachments_id_seq TO service_role;


--
-- Name: TABLE post_reactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.post_reactions TO anon;
GRANT ALL ON TABLE public.post_reactions TO authenticated;
GRANT ALL ON TABLE public.post_reactions TO service_role;


--
-- Name: SEQUENCE post_reactions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.post_reactions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.post_reactions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.post_reactions_id_seq TO service_role;


--
-- Name: TABLE post_reads; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.post_reads TO anon;
GRANT ALL ON TABLE public.post_reads TO authenticated;
GRANT ALL ON TABLE public.post_reads TO service_role;


--
-- Name: SEQUENCE post_reads_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.post_reads_id_seq TO anon;
GRANT ALL ON SEQUENCE public.post_reads_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.post_reads_id_seq TO service_role;


--
-- Name: TABLE post_replies; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.post_replies TO anon;
GRANT ALL ON TABLE public.post_replies TO authenticated;
GRANT ALL ON TABLE public.post_replies TO service_role;


--
-- Name: SEQUENCE post_replies_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.post_replies_id_seq TO anon;
GRANT ALL ON SEQUENCE public.post_replies_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.post_replies_id_seq TO service_role;


--
-- Name: TABLE push_subscriptions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.push_subscriptions TO anon;
GRANT ALL ON TABLE public.push_subscriptions TO authenticated;
GRANT ALL ON TABLE public.push_subscriptions TO service_role;


--
-- Name: SEQUENCE push_subscriptions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.push_subscriptions_id_seq TO service_role;


--
-- Name: TABLE schedule_dates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.schedule_dates TO anon;
GRANT ALL ON TABLE public.schedule_dates TO authenticated;
GRANT ALL ON TABLE public.schedule_dates TO service_role;


--
-- Name: SEQUENCE schedule_dates_date_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.schedule_dates_date_id_seq TO anon;
GRANT ALL ON SEQUENCE public.schedule_dates_date_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.schedule_dates_date_id_seq TO service_role;


--
-- Name: TABLE schedule_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.schedule_events TO anon;
GRANT ALL ON TABLE public.schedule_events TO authenticated;
GRANT ALL ON TABLE public.schedule_events TO service_role;


--
-- Name: SEQUENCE schedule_events_event_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.schedule_events_event_id_seq TO anon;
GRANT ALL ON SEQUENCE public.schedule_events_event_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.schedule_events_event_id_seq TO service_role;


--
-- Name: TABLE schedule_responses; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.schedule_responses TO anon;
GRANT ALL ON TABLE public.schedule_responses TO authenticated;
GRANT ALL ON TABLE public.schedule_responses TO service_role;


--
-- Name: SEQUENCE schedule_responses_response_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.schedule_responses_response_id_seq TO anon;
GRANT ALL ON SEQUENCE public.schedule_responses_response_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.schedule_responses_response_id_seq TO service_role;


--
-- Name: TABLE user_group_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_group_members TO anon;
GRANT ALL ON TABLE public.user_group_members TO authenticated;
GRANT ALL ON TABLE public.user_group_members TO service_role;


--
-- Name: TABLE user_info; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_info TO anon;
GRANT ALL ON TABLE public.user_info TO authenticated;
GRANT ALL ON TABLE public.user_info TO service_role;


--
-- Name: SEQUENCE user_info_user_key_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_info_user_key_seq TO anon;
GRANT ALL ON SEQUENCE public.user_info_user_key_seq TO authenticated;
GRANT ALL ON SEQUENCE public.user_info_user_key_seq TO service_role;


--
-- Name: TABLE welfare_news; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.welfare_news TO anon;
GRANT ALL ON TABLE public.welfare_news TO authenticated;
GRANT ALL ON TABLE public.welfare_news TO service_role;


--
-- Name: SEQUENCE welfare_news_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.welfare_news_id_seq TO anon;
GRANT ALL ON SEQUENCE public.welfare_news_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.welfare_news_id_seq TO service_role;


--
-- Name: TABLE writing_data; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.writing_data TO anon;
GRANT ALL ON TABLE public.writing_data TO authenticated;
GRANT ALL ON TABLE public.writing_data TO service_role;


--
-- Name: SEQUENCE writing_data_writing_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.writing_data_writing_id_seq TO anon;
GRANT ALL ON SEQUENCE public.writing_data_writing_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.writing_data_writing_id_seq TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict DIDkczPudpg9LLsJkbRPGLjIgAl1GqMXeBIO7tQmvKpm3hVyUIhSU4pfk2gA5jf

