// Importación de librerías necesarias
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * @function geniusSearch
 * @description Realiza una búsqueda en la API de Genius para encontrar canciones, letras y otros recursos relacionados.
 * @param {string} search - Término de búsqueda introducido por el usuario.
 * @returns {Promise<SongResponse[]>} Lista de canciones y su información relevante, como artistas y fechas de lanzamiento.
 */
export async function geniusSearch(search: string, options?: OptionsParameters): Promise<SongResponse[] | SongResponse | undefined> {
  try {
    // Petición HTTP para obtener resultados de la API de Genius basados en el término de búsqueda
    const { data } = await axios.get<ApiResponse>(`https://genius.com/api/search/multi?q=${encodeURIComponent(search)}`);
    
    // Filtramos los resultados de la respuesta para obtener los que sean de tipo 'top_hit', 'song' y 'lyric'
    const topHit: Hit[] = data.response.sections.filter(section => section.type === 'top_hit')[0]?.hits || [];
    const song: Hit[] = data.response.sections.filter(section => section.type === 'song')[0]?.hits || [];
    const lyric: Hit[] = data.response.sections.filter(section => section.type === 'lyric')[0]?.hits || [];
    
    // Concatenar todos los resultados en una sola lista de 'songs' y filtramos para quedarnos con los de tipo 'song'
    const songs: Hit[] = topHit.concat(song, lyric).filter(hit => hit.type === 'song');

    // Array para almacenar la información procesada de las canciones
    const songsResponse: SongResponse[] = [];

    // Iteramos sobre cada resultado de canción
    for (const song of songs) {
      const artistInfo: ArtistInfo[] = [];

      // Extraemos información de los artistas principales
      for (const artist of song.result.primary_artists) {
        artistInfo.push({
          name: artist.name,
          is_verified: artist.is_verified,
          header_image_url: artist.header_image_url,
          image_url: artist.image_url
        });
      }

      // Construimos el objeto de respuesta para cada canción
      songsResponse.push({
        title: song.result.title,
        full_title: song.result.full_title,
        url_song: song.result.relationships_index_url,
        url_lyric: song.result.url,
        header_image_url: song.result.header_image_url,
        header_image_thumbnail_url: song.result.header_image_thumbnail_url,
        date: song.result.release_date_for_display,
        artist: artistInfo
      });
    }

    // Devolvemos la información procesada de las canciones
    if (options?.limit) {
      const limit = options.limit;

      // Si el limite es mayor a los resultados devolvemos todos los resultados
      if (limit >= songsResponse.length) {
        return songsResponse;
      } else {
        // Devolvemos el limite de los resultados
        return songsResponse.slice(0, limit); 
      }
    }
  } catch (error) {
    console.error('Error: ', error);
    return undefined; // Devolvemos undefined si ocurre un error
  }
};

// ###################### INTERFACES ######################
// ########################################################

/**
 * @instance OptionsParameters
 * @description Define las opciones para las respuestas
 */
interface OptionsParameters {
  limit: number
}

/**
 * @interface Meta
 * @description Define el estado de la respuesta de la API.
 */
interface Meta {
  status: number;
}

/**
 * @interface Artist
 * @description Define la estructura de un artista, incluyendo su verificación y URLs asociadas.
 */
interface Artist {
  id: number;
  name: string;
  slug: string;
  is_verified: boolean;
  is_meme_verified: boolean;
  iq: number;
  image_url: string;
  header_image_url: string;
  url: string;
}

/**
 * @interface PrimaryArtist
 * @extends Artist
 * @description Extiende la interfaz de Artist con información adicional específica para artistas principales.
 */
interface PrimaryArtist extends Artist {
  api_path: string;
  index_character: string;
}

/**
 * @interface Song
 * @description Define la estructura de una canción, incluyendo detalles sobre el título, fecha de lanzamiento y artistas.
 */
interface Song {
  _type: string;
  annotation_count: number;
  api_path: string;
  artist_names: string;
  full_title: string;
  header_image_thumbnail_url: string;
  header_image_url: string;
  id: number;
  instrumental: boolean;
  lyrics_owner_id: number;
  lyrics_state: string;
  lyrics_updated_at: number;
  path: string;
  primary_artist_names: string;
  pyongs_count: number;
  relationships_index_url: string;
  release_date_components: ReleaseDateComponents;
  release_date_for_display: string;
  release_date_with_abbreviated_month_for_display: string;
  song_art_image_thumbnail_url: string;
  song_art_image_url: string;
  stats: SongStats;
  title: string;
  title_with_featured: string;
  updated_by_human_at: number;
  url: string;
  featured_artists: Artist[];
  primary_artist: PrimaryArtist;
  primary_artists: PrimaryArtist[];
}

/**
 * @interface ReleaseDateComponents
 * @description Define los componentes de la fecha de lanzamiento de una canción.
 */
interface ReleaseDateComponents {
  year: number;
  month: number;
  day: number;
}

/**
 * @interface SongStats
 * @description Define las estadísticas asociadas a una canción, como el número de vistas y anotaciones no revisadas.
 */
interface SongStats {
  unreviewed_annotations: number;
  hot: boolean;
  pageviews: number;
}

/**
 * @interface HighlightRange
 * @description Define un rango dentro de un texto resaltado.
 */
interface HighlightRange {
  start: number;
  end: number;
}

/**
 * @interface Highlight
 * @description Define una parte resaltada dentro de una canción, con su propiedad y valor asociado.
 */
interface Highlight {
  property: string;
  value: string;
  snippet: boolean;
  ranges: HighlightRange[];
}

/**
 * @interface Hit
 * @description Representa el resultado de un hit, que puede ser una canción, artista o cualquier otro recurso.
 */
interface Hit {
  highlights: Highlight[];
  index: string;
  type: string;
  result: Song;
}

/**
 * @interface Section
 * @description Define una sección dentro de la respuesta de la API, que contiene un conjunto de hits.
 */
interface Section {
  type: string;
  hits: Hit[];
}

/**
 * @interface ApiResponse
 * @description Define la estructura completa de la respuesta de la API de Genius, que incluye el estado y las secciones.
 */
interface ApiResponse {
  meta: Meta;
  response: {
    sections: Section[];
  };
}

/**
 * @interface ArtistInfo
 * @description Estructura simplificada para almacenar la información básica de los artistas.
 */
interface ArtistInfo {
  name: string;
  is_verified: boolean;
  header_image_url: string;
  image_url: string;
}

/**
 * @interface SongResponse
 * @description Estructura simplificada para la respuesta de la canción, lista para ser utilizada en la aplicación.
 */
interface SongResponse {
  title: string;
  full_title: string;
  url_song: string;
  url_lyric: string;
  header_image_url: string;
  header_image_thumbnail_url: string;
  date: string;
  artist: ArtistInfo[];
}
