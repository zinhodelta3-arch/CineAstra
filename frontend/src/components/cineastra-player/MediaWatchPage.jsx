"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Play, PictureInPicture2 } from "lucide-react";
import { useVideoPlayer } from "./VideoProvider";
import "./watch-page.css";

export default function MediaWatchPage({ id, type = "movie" }) {
  const { getMedia, consumeWatchOptions, playVideo, openVideo, registerHost, detachHost, activeMedia, playerMode, restoreVideo, episodeId, navigate } = useVideoPlayer();
  const [media, setMedia] = useState(null);
  const [seasonNumber, setSeasonNumber] = useState(1);
  const host = useRef(null);
  useEffect(() => {
    const item = getMedia(id, type);
    setMedia(item); setSeasonNumber(item.seasons?.[0]?.number ?? 1);
    playVideo(item, { ...consumeWatchOptions(id), mode: "page" });
  }, [id, type, getMedia, playVideo, consumeWatchOptions]);
  useLayoutEffect(() => {
    if (!media || !host.current) return;
    const element = host.current;
    registerHost(element);
    return () => detachHost(element);
  }, [media?.id, registerHost, detachHost]);
  useEffect(() => {
    const selectedSeason = media?.seasons?.find((s) => s.episodes.some((e) => e.id === episodeId));
    if (selectedSeason) setSeasonNumber(selectedSeason.number);
  }, [media?.id, episodeId]);
  if (!media) return <main className="ca-watch ca-watch-loading" aria-busy="true">Carregando…</main>;
  const seasons = media.seasons ?? [];
  const season = seasons.find((item) => item.number === seasonNumber) ?? seasons[0];
  const currentEpisode = seasons.flatMap((s) => s.episodes.map((e) => ({ ...e, season: s.number }))).find((e) => e.id === episodeId);
  const sameMedia = activeMedia?.id === media.id;
  const inHost = sameMedia && playerMode === "page";
  const trailer = media.trailerSrc ?? media.trailerUrl ?? media.trailerId;
  const selectEpisode = (ep) => playVideo(media, { mode: "page", episodeId: ep.id, selectionToken: Date.now() });
  return <main className="ca-watch">
    <nav className="ca-watch-nav" aria-label="Navegação do título"><button type="button" onClick={() => navigate("/streamming")}><ArrowLeft size={17} />Voltar ao catálogo</button><a href="/streamming" onClick={(e) => { e.preventDefault(); navigate("/streamming"); }}>CINEASTRA<span>.</span></a></nav>
    <div className={`ca-watch-player-slot ${inHost ? "" : "ca-slot-inactive"}`}>
      <div className="ca-watch-host" ref={host} data-media-id={media.id} />
      {!inHost && <div className="ca-watch-placeholder" style={{ backgroundImage: media.poster ? `linear-gradient(0deg,#090907ee,#09090780),url("${media.poster}")` : undefined }}>
        {sameMedia && playerMode === "mini" ? <><PictureInPicture2 size={30} /><p>O vídeo está no miniplayer.</p><button type="button" onClick={restoreVideo}>Restaurar player</button></> : <button type="button" onClick={() => playVideo(media, { mode: "page" })}><Play size={18} fill="currentColor" /> Abrir player</button>}
      </div>}
    </div>
    <section className="ca-watch-information" aria-label="Informações do título">
      <div className="ca-watch-summary"><h1>{media.title}</h1><div className="ca-watch-meta">
        {media.age && <span className="ca-watch-age">{media.age === "Livre" || media.age === "L" ? "Livre" : media.age}</span>}
        {media.year && <span>{media.year}</span>}{media.genre && <span>{media.genre}</span>}{media.genres?.length > 0 && <span>{media.genres.join(" · ")}</span>}
        {seasons.length ? <span>{seasons.length} {seasons.length === 1 ? "temporada" : "temporadas"}</span> : media.duration && <span>{media.duration}</span>}
      </div><p className="ca-watch-synopsis">{media.synopsis ?? "A sinopse deste título ainda não foi cadastrada."}</p>
      {currentEpisode && sameMedia && <p className="ca-watch-current">T{currentEpisode.season} · E{currentEpisode.number} — {currentEpisode.title}</p>}
      {trailer && <button type="button" className="ca-watch-trailer" onClick={() => openVideo(media.trailerId ?? media, { type: "trailer" })}><Play size={15} /> Assistir trailer</button>}
      </div>
      {(media.cast || media.director || media.audio || media.captionLanguages) && <dl className="ca-watch-credits">
        {media.cast && <><dt>Elenco</dt><dd>{Array.isArray(media.cast) ? media.cast.join(", ") : media.cast}</dd></>}
        {media.director && <><dt>Direção</dt><dd>{media.director}</dd></>}
        {media.audio && <><dt>Áudio</dt><dd>{media.audio}</dd></>}
        {media.captionLanguages && <><dt>Legendas</dt><dd>{media.captionLanguages}</dd></>}
      </dl>}
    </section>
    {media.type === "series" && <section className="ca-watch-episodes" aria-label="Episódios da série"><div className="ca-watch-episode-heading"><h2>Episódios</h2><label><span className="ca-sr-only">Selecionar temporada</span><select aria-label="Selecionar temporada" value={seasonNumber} onChange={(e) => setSeasonNumber(Number(e.target.value))}>{seasons.map((s) => <option key={s.number} value={s.number}>{s.title ?? `Temporada ${s.number}`}</option>)}</select></label></div>
      <div className="ca-watch-episode-grid">{(season?.episodes ?? []).map((ep) => <button type="button" key={ep.id} aria-label={`Assistir episódio ${ep.number}: ${ep.title}`} className={`ca-watch-episode ${sameMedia && episodeId === ep.id ? "is-playing" : ""}`} onClick={() => selectEpisode(ep)}>
        <div className="ca-watch-episode-art">{ep.poster && <img src={ep.poster} alt="" loading="lazy" />}<span className="ca-watch-episode-number">{String(ep.number).padStart(2,"0")}</span><span className="ca-watch-episode-play"><Play size={20} fill="currentColor" /></span>{ep.duration && <small>{ep.duration}</small>}</div>
        <div className="ca-watch-episode-copy"><h3>{ep.title}</h3><p>{ep.synopsis}</p>{sameMedia && episodeId === ep.id && <span>Em reprodução</span>}</div>
      </button>)}</div>
    </section>}
  </main>;
}
