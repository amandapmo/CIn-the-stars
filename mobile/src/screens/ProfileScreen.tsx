import React, {
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  View,
  useWindowDimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

/* Dados e tipos */

const PRIORITIES = [
  'Conservação de Água',
  'Saúde do Solo',
  'Rotação Sustentável',
] as const;

type Priority = (typeof PRIORITIES)[number];

type FarmerProfile = {
  name: string;
  location: string;
  biome: string;
  bio: string;
  avatarUri: string;
  areaHa: string;
  soil: string;
  irrigation: string;
  priorities: Priority[];
};

type FieldPost = {
  id: string;
  title: string;
  coverText: string;
  imageUri: string;
  badge: string;
  category: string;
  biome: string;
  priorities: Priority[];
  notes: string;
  liked: boolean;
};

type ProfileData = {
  version: 1;
  profile: FarmerProfile;
  posts: FieldPost[];
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const STORAGE_KEY = '@cin-stars/agricultural-profile/v1';

const palette = {
  text: '#f8f7ef',
  muted: '#c4cbbf',
  yellow: '#f4c54e',
  yellowDark: '#e2a123',
  stroke: 'rgba(236,238,201,0.20)',
  panel: 'rgba(232,240,215,0.10)',
  background: '#1c3333',
  ink: '#233124',
};

const sampleImages: Record<string, string> = {
  'sample:vegetais':
    'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=1000&q=82',
  'sample:plantio':
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=82',
  'sample:campo':
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=82',
  'sample:mudas':
    'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1000&q=82',
  'sample:colheita':
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1000&q=82',
};

function imageSource(uri: string): ImageSourcePropType {
  return { uri: sampleImages[uri] ?? uri };
}

const INITIAL_DATA: ProfileData = {
  version: 1,
  profile: {
    name: 'João Silva',
    location: 'Pernambuco, BR',
    biome: 'Semiárido',
    bio: 'Agricultor familiar há 15 anos, focado em convivência com o semiárido e manejo sustentável.',
    avatarUri: '',
    areaHa: '12',
    soil: 'Franco-arenoso',
    irrigation: 'Sequeiro',
    priorities: [...PRIORITIES],
  },
  posts: [
    {
      id: 'milho',
      title: 'Cultivo de Milho em Linha',
      coverText: 'Milho em Linha',
      imageUri: '',
      priorities: ['Conservação de Água', 'Rotação Sustentável'],
      liked: true,
      notes:
        'Plantio em curvas de nível para retenção da umidade das chuvas no solo franco-arenoso e aumento da produtividade no semiárido.',
    },
    {
      id: 'preparo',
      title: 'Preparo e Estrutura do Solo',
      coverText: 'Preparo do solo',
      imageUri: 'sample:vegetais',
      priorities: ['Saúde do Solo'],
      liked: false,
      notes:
        'Cobertura orgânica e preparo mínimo para preservar a estrutura do solo e criar boas condições para o desenvolvimento das raízes.',
    },
    {
      id: 'irrigacao',
      title: 'Irrigação Localizada',
      coverText: 'Água na medida certa',
      imageUri: 'sample:plantio',
      priorities: ['Conservação de Água'],
      liked: false,
      notes:
        'Irrigação próxima às raízes, com acompanhamento da umidade do solo para reduzir a evaporação e o desperdício de água.',
    },
    {
      id: 'consorcio',
      title: 'Consórcio de Leguminosas',
      coverText: 'Diversidade no campo',
      imageUri: 'sample:campo',
      priorities: ['Rotação Sustentável', 'Saúde do Solo'],
      liked: false,
      notes:
        'Consórcio de culturas e leguminosas adaptadas à região para diversificar a produção e manter o solo coberto entre os ciclos.',
    },
    {
      id: 'hortalicas',
      title: 'Hortaliças e Biofertilizantes',
      coverText: 'Vida que cresce',
      imageUri: 'sample:mudas',
      priorities: ['Saúde do Solo'],
      liked: false,
      notes:
        'Manejo integrado com biofertilizante orgânico produzido na propriedade, garantindo folhas vigorosas e livres de defensivos sintéticos.',
    },
    {
      id: 'colheita',
      title: 'Colheita e Secagem',
      coverText: 'Tempo de colher',
      imageUri: 'sample:colheita',
      priorities: ['Rotação Sustentável'],
      liked: false,
      notes:
        'Colheita no ponto adequado e secagem em local ventilado, com acompanhamento da umidade para preservar a qualidade dos grãos.',
    },
  ].map(
    post =>
      ({
        badge: 'Boas técnicas',
        category: 'Registro de Campo',
        biome: 'Semiárido',
        ...post,
      }) as FieldPost,
  ),
};

function newPost(profile: FarmerProfile): FieldPost {
  return {
    id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: '',
    coverText: '',
    imageUri: '',
    badge: 'Boas técnicas',
    category: 'Registro de Campo',
    biome: profile.biome,
    priorities: [],
    notes: '',
    liked: false,
  };
}

function validateProfile(value: FarmerProfile): string | null {
  if (!value.name.trim()) return 'Preencha o nome.';
  if (!value.location.trim()) return 'Preencha a localização.';
  if (!value.biome.trim()) return 'Preencha a região ou o bioma.';

  const area = Number(value.areaHa.replace(',', '.'));

  if (!Number.isFinite(area) || area <= 0) {
    return 'Informe uma área maior que zero, em hectares.';
  }

  if (!value.soil.trim()) return 'Informe o tipo de solo.';
  if (!value.irrigation.trim()) return 'Informe o sistema de irrigação.';

  if (!value.priorities.length) {
    return 'Selecione pelo menos uma prioridade agrícola.';
  }

  return null;
}

function validatePost(value: FieldPost): string | null {
  if (!value.title.trim()) return 'Preencha o título da postagem.';

  if (!value.imageUri && !value.coverText.trim()) {
    return 'Escolha uma foto ou escreva um texto para a capa.';
  }

  if (!value.badge.trim()) return 'Preencha o selo do card.';
  if (!value.category.trim()) return 'Preencha o tipo de registro.';
  if (!value.biome.trim()) return 'Preencha a região ou o bioma.';

  if (!value.priorities.length) {
    return 'Selecione pelo menos uma técnica agrícola.';
  }

  if (!value.notes.trim()) {
    return 'Escreva a legenda e as observações.';
  }

  return null;
}

/* Persistência local */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasStrings(
  value: Record<string, unknown>,
  keys: string[],
) {
  return keys.every(key => typeof value[key] === 'string');
}

function hasPriorities(value: Record<string, unknown>) {
  return (
    Array.isArray(value.priorities) &&
    value.priorities.every(item => PRIORITIES.includes(item))
  );
}

function isProfileData(value: unknown): value is ProfileData {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !isRecord(value.profile) ||
    !Array.isArray(value.posts)
  ) {
    return false;
  }

  if (
    !hasStrings(value.profile, [
      'name',
      'location',
      'biome',
      'bio',
      'avatarUri',
      'areaHa',
      'soil',
      'irrigation',
    ]) ||
    !hasPriorities(value.profile)
  ) {
    return false;
  }

  const ids = new Set<string>();

  return value.posts.every(post => {
    if (
      !isRecord(post) ||
      !hasStrings(post, [
        'id',
        'title',
        'coverText',
        'imageUri',
        'badge',
        'category',
        'biome',
        'notes',
      ]) ||
      !hasPriorities(post) ||
      typeof post.liked !== 'boolean'
    ) {
      return false;
    }

    if (ids.has(post.id as string)) return false;
    ids.add(post.id as string);

    return true;
  });
}

function useProfileStore() {
  const [data, setData] = useState<ProfileData>(INITIAL_DATA);
  const current = useRef(data);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (!active || !raw) return;

        const saved: unknown = JSON.parse(raw);

        if (!isProfileData(saved)) {
          throw new Error('Formato de dados inválido.');
        }

        current.current = saved;
        setData(saved);
      })
      .catch(() => {
        if (active) {
          setError(
            'Não foi possível carregar os dados salvos. Os exemplos estão sendo exibidos.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function update(change: (previous: ProfileData) => ProfileData) {
    setPending(value => value + 1);

    const operation = queue.current
      .then(async () => {
        const next = change(current.current);

        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(next),
        );

        current.current = next;
        setData(next);
        setError('');
      })
      .catch(() => {
        const message =
          'Não foi possível salvar. Verifique o espaço disponível e tente novamente.';

        setError(message);
        throw new Error(message);
      })
      .finally(() => setPending(value => value - 1));

    queue.current = operation.catch(() => undefined);

    return operation;
  }

  return {
    data,
    loading,
    saving: pending > 0,
    error,

    saveProfile: (profile: FarmerProfile) =>
      update(previous => ({ ...previous, profile })),

    savePost: (post: FieldPost) =>
      update(previous => ({
        ...previous,
        posts: previous.posts.some(item => item.id === post.id)
          ? previous.posts.map(item =>
              item.id === post.id ? post : item,
            )
          : [post, ...previous.posts],
      })),

    setNotes: (id: string, notes: string) =>
      update(previous => ({
        ...previous,
        posts: previous.posts.map(post =>
          post.id === id ? { ...post, notes } : post,
        ),
      })),

    toggleLike: (id: string) =>
      update(previous => ({
        ...previous,
        posts: previous.posts.map(post =>
          post.id === id
            ? { ...post, liked: !post.liked }
            : post,
        ),
      })),
  };
}

/* Fotos */

async function choosePhoto(square = false): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: square ? [1, 1] : [4, 3],
    quality: 0.7,
    base64: Platform.OS === 'web',
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];

  if (Platform.OS === 'web') {
    if (!asset.base64) {
      throw new Error(
        'Não foi possível ler a imagem. Escolha outra foto.',
      );
    }

    return `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
  }

  const { Directory, File, Paths } = await import('expo-file-system');

  const directory = new Directory(
    Paths.document,
    'agricultural-profile',
  );

  directory.create({
    idempotent: true,
    intermediates: true,
  });

  const extension =
    asset.fileName?.match(/\.[a-z0-9]+$/i)?.[0] || '.jpg';

  const destination = new File(
    directory,
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`,
  );

  await new File(asset.uri).copy(destination);

  return destination.uri;
}

function FarmerAvatar({ size = 100 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityLabel="Ilustração de agricultor"
    >
      <Defs>
        <SvgLinearGradient id="avatar-bg" x2="1" y2="1">
          <Stop stopColor="#9aaa61" />
          <Stop offset="1" stopColor="#718a49" />
        </SvgLinearGradient>
      </Defs>

      <Circle cx="50" cy="50" r="50" fill="url(#avatar-bg)" />

      <Path
        d="M13 100 22 78Q29 70 42 70H60Q75 72 80 82L87 100"
        fill="#416747"
      />
      <Path
        d="M40 64V77L50 87 61 76V63"
        fill="#c18d63"
      />
      <Path
        d="M28 40Q26 18 48 17 71 16 70 39L66 60Q60 74 49 74 38 72 32 59Z"
        fill="#d0a274"
      />
      <Path
        d="M28 43Q23 25 36 20 52 10 66 23 73 29 70 44L65 33Q51 25 34 35L32 44"
        fill="#423327"
      />
      <Path
        d="M37 42 45 41M54 41 62 42"
        stroke="#4c382c"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="41" cy="45" r="1.7" fill="#372e25" />
      <Circle cx="58" cy="45" r="1.7" fill="#372e25" />
      <Path
        d="m49 45-2 10h5M43 62Q50 65 57 61"
        stroke="#78553f"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="m32 73 17 14 15-14-4 26H36Z"
        fill="#b4bd79"
      />
      <Path
        d="m26 77 7 23M72 78l-6 22"
        stroke="#9d673f"
        strokeWidth="4"
      />
    </Svg>
  );
}

/* Componentes compartilhados */

function Action({
  label,
  onPress,
  icon,
  iconAfter = false,
  secondary = false,
  disabled = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  iconAfter?: boolean;
  secondary?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const iconElement = icon ? (
    <Ionicons
      name={icon}
      size={20}
      color={secondary ? palette.text : palette.ink}
    />
  ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        u.actionShell,
        compact && { flex: 0 },
        disabled && { opacity: 0.45 },
        pressed && {
          opacity: 0.78,
          transform: [{ scale: 0.98 }],
        },
      ]}
    >
      <LinearGradient
        colors={
          secondary
            ? ['#344544', '#304341']
            : [palette.yellow, palette.yellowDark]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          u.action,
          secondary && u.secondaryAction,
          compact && { paddingHorizontal: 14 },
        ]}
      >
        {!iconAfter && iconElement}

        <Text
          style={[
            u.actionText,
            secondary && { color: palette.text },
          ]}
        >
          {label}
        </Text>

        {iconAfter && iconElement}
      </LinearGradient>
    </Pressable>
  );
}

function IconButton({
  name,
  label,
  onPress,
  disabled = false,
  active = false,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        u.iconButton,
        active && u.activeIcon,
        (disabled || pressed) && {
          opacity: disabled ? 0.3 : 0.7,
        },
      ]}
    >
      <Ionicons
        name={name}
        size={26}
        color={active ? '#ffb3c3' : palette.text}
      />
    </Pressable>
  );
}

const chipColors: Record<
  Priority,
  {
    backgroundColor: string;
    borderColor: string;
    color: string;
  }
> = {
  'Conservação de Água': {
    backgroundColor: '#27545a',
    borderColor: '#54888e',
    color: '#c6e5e5',
  },
  'Saúde do Solo': {
    backgroundColor: '#67531e',
    borderColor: '#a1853b',
    color: '#f5e0a5',
  },
  'Rotação Sustentável': {
    backgroundColor: '#505c24',
    borderColor: '#919c43',
    color: '#e5e9b5',
  },
};

function Chip({
  priority,
  selected = true,
  onPress,
}: {
  priority: Priority;
  selected?: boolean;
  onPress?: () => void;
}) {
  const color = chipColors[priority];

  const body = (
    <Text
      style={[
        u.chipText,
        { color: selected ? color.color : palette.muted },
      ]}
    >
      {priority}
    </Text>
  );

  const style = [
    u.chip,
    selected
      ? {
          backgroundColor: color.backgroundColor,
          borderColor: color.borderColor,
        }
      : u.unselectedChip,
  ];

  if (!onPress) return <View style={style}>{body}</View>;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={priority}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={style}
    >
      {selected && (
        <Ionicons name="checkmark" size={14} color={color.color} />
      )}
      {body}
    </Pressable>
  );
}

function PriorityPicker({
  value,
  onChange,
  label = 'Prioridades agrícolas *',
}: {
  value: Priority[];
  onChange: (value: Priority[]) => void;
  label?: string;
}) {
  return (
    <View style={u.field}>
      <Text style={u.label}>{label}</Text>
      <Text style={u.hint}>
        Pode selecionar mais de uma opção.
      </Text>

      <View style={u.wrap}>
        {PRIORITIES.map(priority => (
          <Chip
            key={priority}
            priority={priority}
            selected={value.includes(priority)}
            onPress={() =>
              onChange(
                value.includes(priority)
                  ? value.filter(item => item !== priority)
                  : [...value, priority],
              )
            }
          />
        ))}
      </View>
    </View>
  );
}

function Field({
  label,
  hint,
  ...props
}: TextInputProps & {
  label: string;
  hint?: string;
}) {
  return (
    <View style={u.field}>
      <Text style={u.label}>{label}</Text>

      <TextInput
        accessibilityLabel={label.replace(' *', '')}
        placeholderTextColor="#87988d"
        selectionColor={palette.yellow}
        {...props}
        style={[
          u.input,
          props.multiline && u.textarea,
          props.style,
        ]}
      />

      {!!hint && <Text style={u.hint}>{hint}</Text>}
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={u.section}>
      <Text style={u.sectionLabel}>{title}</Text>
      {children}
    </View>
  );
}

function ErrorBox({ message }: { message: string }) {
  if (!message) return null;

  return (
    <View accessibilityRole="alert" style={u.errorBox}>
      <Ionicons
        name="alert-circle-outline"
        size={20}
        color="#ffd3ba"
      />
      <Text style={u.errorText}>{message}</Text>
    </View>
  );
}

function Photo({
  uri,
  coverText = '',
  avatar = false,
  onChange,
}: {
  uri: string;
  coverText?: string;
  avatar?: boolean;
  onChange: (uri: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pick() {
    setBusy(true);
    setError('');

    try {
      const photo = await choosePhoto(avatar);
      if (photo) onChange(photo);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível abrir a galeria.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={u.field}>
      <Text style={u.label}>
        {avatar ? 'Foto do perfil' : 'Imagem da postagem'}
      </Text>

      <View
        style={[
          u.photoPreview,
          avatar && u.avatarPreview,
        ]}
      >
        {uri ? (
          <Image
            source={imageSource(uri)}
            style={[
              StyleSheet.absoluteFill,
              { width: '100%', height: '100%' },
            ]}
            resizeMode="cover"
            accessibilityLabel={
              avatar ? 'Foto do perfil' : 'Imagem selecionada'
            }
            onError={() =>
              setError(
                'Não foi possível carregar esta imagem. Escolha outra foto.',
              )
            }
          />
        ) : avatar ? (
          <FarmerAvatar size={104} />
        ) : (
          <>
            <Ionicons
              name="images-outline"
              size={30}
              color={palette.yellow}
            />
            <Text style={u.hint}>
              {coverText || 'Uma foto conta a sua história'}
            </Text>
          </>
        )}
      </View>

      <View style={u.row}>
        <Action
          label={busy ? 'Abrindo galeria…' : 'Escolher foto'}
          icon="image-outline"
          secondary
          onPress={() => {
            void pick();
          }}
          disabled={busy}
        />

        {!!uri && (
          <IconButton
            name="trash-outline"
            label="Remover foto"
            onPress={() => {
              onChange('');
              setError('');
            }}
            disabled={busy}
          />
        )}
      </View>

      {busy && <ActivityIndicator color={palette.yellow} />}

      <ErrorBox message={error} />
    </View>
  );
}

function PostVisual({
  post,
  children,
  mini = false,
}: {
  post: FieldPost;
  children?: ReactNode;
  mini?: boolean;
}) {
  const [failedUri, setFailedUri] = useState('');

  const showImage =
    !!post.imageUri && failedUri !== post.imageUri;

  return (
    <View
      style={[
        u.visual,
        !mini && { minHeight: 320 },
      ]}
    >
      {showImage ? (
        <Image
          source={imageSource(post.imageUri)}
          style={[
            StyleSheet.absoluteFill,
            { width: '100%', height: '100%' },
          ]}
          resizeMode="cover"
          accessibilityLabel={post.title}
          onError={() => setFailedUri(post.imageUri)}
        />
      ) : (
        <View
          style={[
            u.coverFallback,
            mini && { padding: 4 },
          ]}
        >
          <Text
            numberOfLines={mini ? 2 : 4}
            style={[
              u.coverText,
              mini && u.miniCoverText,
            ]}
          >
            {post.coverText || post.title}
          </Text>
        </View>
      )}

      {children}
    </View>
  );
}

/* Formulários */

function FormFrame({
  title,
  subtitle,
  onClose,
  onSave,
  saving,
  submitLabel,
  children,
  error,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  submitLabel: string;
  children: ReactNode;
  error: string;
}) {
  const scroll =
    useRef<React.ComponentRef<typeof ScrollView>>(null);

  return (
    <KeyboardAvoidingView
      style={e.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={e.header}>
        <IconButton
          name="arrow-back"
          label="Voltar sem salvar"
          onPress={onClose}
          disabled={saving}
        />

        <View style={e.flex}>
          <Text style={e.eyebrow}>MEU CANTO NO CAMPO</Text>
          <Text accessibilityRole="header" style={e.title}>
            {title}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={e.form}
        showsVerticalScrollIndicator={false}
      >
        <Text style={e.subtitle}>{subtitle}</Text>

        {children}

        <View
          onLayout={() => {
            if (error) {
              scroll.current?.scrollToEnd({
                animated: true,
              });
            }
          }}
        >
          <ErrorBox message={error} />
        </View>

        <Text style={u.hint}>* Campos obrigatórios.</Text>
      </ScrollView>

      <View style={e.footer}>
        <Action
          label="Cancelar"
          onPress={onClose}
          secondary
          disabled={saving}
        />

        <Action
          label={saving ? 'Salvando…' : submitLabel}
          onPress={onSave}
          icon="checkmark"
          disabled={saving}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Options({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <View
      style={[
        u.wrap,
        { marginTop: -7, marginBottom: 22 },
      ]}
    >
      {options.map(option => (
        <Pressable
          key={option}
          accessibilityRole="radio"
          accessibilityLabel={option}
          accessibilityState={{ selected: value === option }}
          onPress={() => onChange(option)}
          style={[
            e.option,
            value === option && e.selectedOption,
          ]}
        >
          <Text
            style={[
              e.optionText,
              value === option && {
                color: palette.yellow,
              },
            ]}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ProfileEditor({
  profile,
  onClose,
  onSave,
  saving,
}: {
  profile: FarmerProfile;
  onClose: () => void;
  onSave: (value: FarmerProfile) => Promise<void>;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<FarmerProfile>({
    ...profile,
    priorities: [...profile.priorities],
  });

  const [error, setError] = useState('');

  function change<K extends keyof FarmerProfile>(
    key: K,
    value: FarmerProfile[K],
  ) {
    setDraft(previous => ({ ...previous, [key]: value }));
    setError('');
  }

  async function submit() {
    const invalid = validateProfile(draft);

    if (invalid) {
      setError(invalid);
      return;
    }

    const next = {
      ...draft,
      name: draft.name.trim(),
      location: draft.location.trim(),
      biome: draft.biome.trim(),
      bio: draft.bio.trim(),
      soil: draft.soil.trim(),
      irrigation: draft.irrigation.trim(),
      areaHa: String(Number(draft.areaHa.replace(',', '.'))),
    };

    try {
      await onSave(next);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível salvar o perfil.',
      );
    }
  }

  return (
    <FormFrame
      title="Editar perfil"
      subtitle="Seu campo tem uma história. Conte um pouco sobre você e sua propriedade."
      onClose={onClose}
      onSave={() => {
        void submit();
      }}
      saving={saving}
      submitLabel="Salvar perfil"
      error={error}
    >
      <Section title="Sobre você">
        <Photo
          avatar
          uri={draft.avatarUri}
          onChange={value => change('avatarUri', value)}
        />

        <Field
          label="Nome *"
          value={draft.name}
          onChangeText={value => change('name', value)}
          placeholder="Como você se chama?"
          maxLength={70}
          autoComplete="name"
        />

        <Field
          label="Localização *"
          value={draft.location}
          onChangeText={value => change('location', value)}
          placeholder="Ex.: Pernambuco, BR"
          maxLength={80}
        />

        <Field
          label="Região ou bioma *"
          value={draft.biome}
          onChangeText={value => change('biome', value)}
          placeholder="Ex.: Semiárido"
          maxLength={50}
        />

        <Field
          label="Biografia"
          value={draft.bio}
          onChangeText={value => change('bio', value)}
          multiline
          maxLength={300}
          placeholder="Sua experiência, seus cultivos e sua relação com a terra…"
          hint={`${draft.bio.length}/300 caracteres`}
        />
      </Section>

      <Section title="Sua propriedade">
        <Field
          label="Área da propriedade (ha) *"
          value={draft.areaHa}
          onChangeText={value => change('areaHa', value)}
          keyboardType="decimal-pad"
          placeholder="Ex.: 12 ou 12,5"
          maxLength={12}
        />

        <Field
          label="Tipo de solo *"
          value={draft.soil}
          onChangeText={value => change('soil', value)}
          placeholder="Ex.: Franco-arenoso"
          maxLength={60}
        />

        <Options
          value={draft.soil}
          onChange={value => change('soil', value)}
          options={[
            'Franco-arenoso',
            'Argiloso',
            'Arenoso',
            'Siltoso',
            'Franco',
          ]}
        />

        <Field
          label="Sistema de irrigação *"
          value={draft.irrigation}
          onChangeText={value => change('irrigation', value)}
          placeholder="Ex.: Sequeiro"
          maxLength={60}
        />

        <Options
          value={draft.irrigation}
          onChange={value => change('irrigation', value)}
          options={[
            'Sequeiro',
            'Gotejamento',
            'Aspersão',
            'Microaspersão',
            'Sulcos',
          ]}
        />

        <PriorityPicker
          value={draft.priorities}
          onChange={value => change('priorities', value)}
        />
      </Section>
    </FormFrame>
  );
}

function PostEditor({
  post,
  creating,
  onClose,
  onSave,
  saving,
}: {
  post: FieldPost;
  creating: boolean;
  onClose: () => void;
  onSave: (value: FieldPost) => Promise<void>;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<FieldPost>({
    ...post,
    priorities: [...post.priorities],
  });

  const [error, setError] = useState('');

  function change<K extends keyof FieldPost>(
    key: K,
    value: FieldPost[K],
  ) {
    setDraft(previous => ({ ...previous, [key]: value }));
    setError('');
  }

  async function submit() {
    const invalid = validatePost(draft);

    if (invalid) {
      setError(invalid);
      return;
    }

    const next = {
      ...draft,
      title: draft.title.trim(),
      coverText: draft.coverText.trim(),
      badge: draft.badge.trim(),
      category: draft.category.trim(),
      biome: draft.biome.trim(),
      notes: draft.notes.trim(),
    };

    try {
      await onSave(next);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível salvar a postagem.',
      );
    }
  }

  return (
    <FormFrame
      title={creating ? 'Nova postagem' : 'Editar postagem'}
      subtitle="Compartilhe o que dá certo na sua terra. Cada registro ajuda uma boa ideia a criar raízes."
      onClose={onClose}
      onSave={() => {
        void submit();
      }}
      saving={saving}
      submitLabel={
        creating ? 'Publicar registro' : 'Salvar postagem'
      }
      error={error}
    >
      <Section title="A história do seu registro">
        <Photo
          uri={draft.imageUri}
          coverText={draft.coverText}
          onChange={value => change('imageUri', value)}
        />

        <Field
          label={
            draft.imageUri
              ? 'Texto da capa (opcional)'
              : 'Texto da capa *'
          }
          value={draft.coverText}
          onChangeText={value => change('coverText', value)}
          placeholder="Ex.: Milho em Linha"
          maxLength={70}
          hint="Aparece no lugar da foto quando o registro não tem imagem."
        />

        <Field
          label="Título da postagem *"
          value={draft.title}
          onChangeText={value => change('title', value)}
          placeholder="Ex.: Cultivo de Milho em Linha"
          maxLength={100}
        />

        <Field
          label="Selo do card *"
          value={draft.badge}
          onChangeText={value => change('badge', value)}
          placeholder="Ex.: Boas técnicas"
          maxLength={30}
        />

        <Field
          label="Tipo de registro *"
          value={draft.category}
          onChangeText={value => change('category', value)}
          placeholder="Ex.: Registro de Campo"
          maxLength={45}
        />

        <Field
          label="Região ou bioma *"
          value={draft.biome}
          onChangeText={value => change('biome', value)}
          placeholder="Ex.: Semiárido"
          maxLength={50}
        />
      </Section>

      <Section title="O que você fez no campo">
        <PriorityPicker
          label="Técnicas e prioridades *"
          value={draft.priorities}
          onChange={value => change('priorities', value)}
        />

        <Field
          label="Legenda e observações *"
          value={draft.notes}
          onChangeText={value => change('notes', value)}
          multiline
          maxLength={2000}
          placeholder="Descreva a prática, como foi realizada e o que você observou…"
          hint={`${draft.notes.length}/2000 caracteres`}
        />

        <View style={e.switchRow}>
          <View style={e.flex}>
            <Text style={u.label}>Marcar como favorito</Text>
            <Text style={u.hint}>
              Destaca o coração deste registro.
            </Text>
          </View>

          <Switch
            accessibilityLabel="Marcar como favorito"
            value={draft.liked}
            onValueChange={value => change('liked', value)}
            trackColor={{
              false: '#5a6854',
              true: '#ac7b32',
            }}
            thumbColor={
              draft.liked ? palette.yellow : '#d6ded1'
            }
          />
        </View>
      </Section>

      <Section title="Prévia do seu card">
        <View style={e.preview}>
          <PostVisual post={draft}>
            <View style={e.previewBadge}>
              <Text style={e.previewBadgeText}>
                ϟ {(draft.badge || 'Boas técnicas').toUpperCase()}
              </Text>
            </View>

            <LinearGradient
              colors={[
                'transparent',
                'rgba(18,38,30,0.98)',
              ]}
              style={e.previewTitle}
            >
              <Text style={e.previewCategory}>
                {draft.category || 'Registro de Campo'} •{' '}
                {draft.biome || 'Região'}
              </Text>

              <Text style={e.previewHeading}>
                {draft.title || 'Título da sua postagem'}
                {draft.liked ? ' ♥' : ''}
              </Text>
            </LinearGradient>
          </PostVisual>

          <View style={e.previewBody}>
            <View style={u.wrap}>
              {draft.priorities.map(priority => (
                <Chip key={priority} priority={priority} />
              ))}
            </View>

            <Text style={e.previewCategory}>
              LEGENDA & OBSERVAÇÕES
            </Text>

            <Text style={e.previewNotes}>
              {draft.notes || 'Suas observações aparecem aqui.'}
            </Text>
          </View>
        </View>
      </Section>
    </FormFrame>
  );
}

function CaptionEditor({
  post,
  onClose,
  onSave,
  saving,
}: {
  post: FieldPost;
  onClose: () => void;
  onSave: (notes: string) => Promise<void>;
  saving: boolean;
}) {
  const [notes, setNotes] = useState(post.notes);
  const [error, setError] = useState('');

  async function submit() {
    if (!notes.trim()) {
      setError('Escreva a legenda e as observações.');
      return;
    }

    try {
      await onSave(notes.trim());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível salvar a legenda.',
      );
    }
  }

  return (
    <FormFrame
      title="Editar legenda"
      subtitle={post.title}
      onClose={onClose}
      onSave={() => {
        void submit();
      }}
      saving={saving}
      submitLabel="Salvar legenda"
      error={error}
    >
      <Field
        label="Legenda e observações *"
        multiline
        autoFocus
        value={notes}
        maxLength={2000}
        onChangeText={value => {
          setNotes(value);
          setError('');
        }}
        hint={`${notes.length}/2000 caracteres`}
        style={{ minHeight: 210 }}
      />
    </FormFrame>
  );
}

/* Perfil e galeria */

type Screen =
  | { kind: 'profile' }
  | { kind: 'detail'; id: string }
  | { kind: 'profile-editor' }
  | {
      kind: 'post-editor';
      post: FieldPost;
      creating: boolean;
      returnId?: string;
    }
  | { kind: 'caption-editor'; id: string };

function ProfileHeader({
  profile,
  onEdit,
}: {
  profile: FarmerProfile;
  onEdit: () => void;
}) {
  const [failedUri, setFailedUri] = useState('');

  return (
    <View style={s.profileHeader}>
      <View style={s.avatar}>
        {profile.avatarUri &&
        failedUri !== profile.avatarUri ? (
          <Image
            source={{ uri: profile.avatarUri }}
            style={s.avatarImage}
            accessibilityLabel={`Foto de ${profile.name}`}
            onError={() => setFailedUri(profile.avatarUri)}
          />
        ) : (
          <FarmerAvatar size={92} />
        )}
      </View>

      <View style={s.profileInfo}>
        <Text accessibilityRole="header" style={s.name}>
          {profile.name}
        </Text>

        <Text style={s.location}>
          {profile.location}
          <Text style={s.locationDot}> • </Text>
          {profile.biome}
        </Text>

        <Text numberOfLines={2} style={s.bio}>
          {profile.bio ||
            'Cultivando histórias e compartilhando boas práticas.'}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Editar perfil"
        onPress={onEdit}
        style={({ pressed }) => [
          s.editButton,
          pressed && { opacity: 0.7 },
        ]}
      >
        <Ionicons
          name="pencil-outline"
          size={14}
          color="#f4dfa1"
        />
        <Text style={s.editButtonText}>Editar</Text>
      </Pressable>
    </View>
  );
}

function FarmStats({ profile }: { profile: FarmerProfile }) {
  const stats = [
    {
      icon: 'location' as const,
      color: '#b8ca64',
      label: 'Área:',
      value: `${profile.areaHa.replace('.', ',')} ha`,
    },
    {
      icon: 'map' as const,
      color: '#e1bd7c',
      label: 'Solo:',
      value: profile.soil,
    },
    {
      icon: 'water' as const,
      color: '#8fcce1',
      label: 'Irrigação:',
      value: profile.irrigation,
    },
  ];

  return (
    <View style={s.stats}>
      {stats.map(stat => (
        <View key={stat.label} style={s.statCard}>
          <Ionicons
            name={stat.icon}
            size={27}
            color={stat.color}
          />
          <Text style={s.statLabel}>{stat.label}</Text>
          <Text style={s.statValue}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
}

function PostGrid({
  posts,
  onOpen,
  tileSize,
}: {
  posts: FieldPost[];
  onOpen: (id: string) => void;
  tileSize: number;
}) {
  return (
    <View style={s.grid}>
      {posts.map(post => (
        <Pressable
          key={post.id}
          accessibilityRole="button"
          accessibilityLabel={`Abrir postagem: ${post.title}`}
          onPress={() => onOpen(post.id)}
          style={({ pressed }) => [
            s.gridItem,
            {
              width: tileSize,
              height: tileSize * 0.83,
            },
            pressed && { opacity: 0.75 },
          ]}
        >
          <PostVisual post={post} mini />

          <LinearGradient
            colors={[
              'transparent',
              'rgba(5,16,13,0.84)',
            ]}
            style={s.gridCaption}
          >
            <Text numberOfLines={1} style={s.gridTitle}>
              {post.title}
            </Text>
          </LinearGradient>
        </Pressable>
      ))}

      {!posts.length && (
        <View style={s.empty}>
          <Ionicons
            name="leaf-outline"
            size={36}
            color={palette.yellow}
          />
          <Text style={s.emptyTitle}>
            Cada história começa com uma semente.
          </Text>
          <Text style={s.helper}>
            Crie seu primeiro registro de campo.
          </Text>
        </View>
      )}
    </View>
  );
}

function PostDetails({
  posts,
  id,
  saving,
  onSelect,
  onClose,
  onLike,
  onCaption,
  onEdit,
}: {
  posts: FieldPost[];
  id: string;
  saving: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
  onLike: (id: string) => void;
  onCaption: (id: string) => void;
  onEdit: (post: FieldPost) => void;
}) {
  const index = posts.findIndex(post => post.id === id);
  const post = posts[index];

  const thumbnails =
    useRef<React.ComponentRef<typeof ScrollView>>(null);

  const details =
    useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    thumbnails.current?.scrollTo({
      x: Math.max(0, index * 72 - 100),
      animated: true,
    });

    details.current?.scrollTo({
      y: 0,
      animated: false,
    });
  }, [index]);

  if (!post) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>
          Registro não encontrado.
        </Text>
        <Action
          label="Voltar ao perfil"
          onPress={onClose}
          compact
        />
      </View>
    );
  }

  function previous() {
    if (index > 0) onSelect(posts[index - 1].id);
  }

  function next() {
    if (index < posts.length - 1) {
      onSelect(posts[index + 1].id);
    }
  }

  return (
    <ScrollView
      ref={details}
      contentContainerStyle={s.detailScroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.detailCard}>
        <View style={s.hero}>
          <PostVisual post={post}>
            <LinearGradient
              colors={[
                'rgba(0,0,0,0.22)',
                'transparent',
                'rgba(21,41,33,0.98)',
              ]}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View style={s.heroTop}>
              <View style={s.badge}>
                <Ionicons
                  name="flash"
                  size={15}
                  color={palette.yellow}
                />

                <Text
                  numberOfLines={1}
                  style={s.badgeText}
                >
                  {post.badge.toUpperCase()}
                </Text>
              </View>

              <View style={s.counter}>
                <Text style={s.counterText}>
                  {index + 1} / {posts.length}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar ao perfil"
                onPress={onClose}
                style={s.backPill}
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={palette.text}
                />
                <Text style={s.counterText}>Perfil</Text>
              </Pressable>
            </View>

            <View
              style={s.heroArrows}
              pointerEvents="box-none"
            >
              <IconButton
                name="chevron-back"
                label="Foto anterior"
                onPress={previous}
                disabled={index === 0}
              />

              <IconButton
                name="chevron-forward"
                label="Próxima foto"
                onPress={next}
                disabled={index === posts.length - 1}
              />
            </View>

            <View style={s.heroBottom}>
              <View style={s.heroTitleBlock}>
                <Text style={s.category}>
                  {post.category.toUpperCase()} •{' '}
                  {post.biome.toUpperCase()}
                </Text>

                <Text
                  accessibilityRole="header"
                  style={s.postTitle}
                >
                  {post.title}
                </Text>
              </View>

              <IconButton
                name={
                  post.liked ? 'heart' : 'heart-outline'
                }
                label={
                  post.liked
                    ? 'Remover dos favoritos'
                    : 'Adicionar aos favoritos'
                }
                active={post.liked}
                onPress={() => onLike(post.id)}
                disabled={saving}
              />
            </View>
          </PostVisual>
        </View>

        <View style={s.detailBody}>
          <View style={u.wrap}>
            {post.priorities.map(priority => (
              <Chip key={priority} priority={priority} />
            ))}
          </View>

          <View style={s.notesBox}>
            <View style={s.notesHeading}>
              <Text style={s.notesLabel}>
                LEGENDA & OBSERVAÇÕES
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Editar legenda"
                onPress={() => onCaption(post.id)}
                style={s.editNotes}
              >
                <Ionicons
                  name="pencil-outline"
                  size={16}
                  color="#f0d885"
                />
                <Text style={s.editNotesText}>
                  Editar legenda
                </Text>
              </Pressable>
            </View>

            <Text style={s.notes}>{post.notes}</Text>
          </View>

          <View style={s.detailDivider} />

          <ScrollView
            ref={thumbnails}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.thumbnails}
          >
            {posts.map((item, itemIndex) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Ver postagem ${itemIndex + 1}: ${item.title}`}
                accessibilityState={{
                  selected: item.id === post.id,
                }}
                onPress={() => onSelect(item.id)}
                style={[
                  s.thumbnail,
                  item.id === post.id &&
                    s.selectedThumbnail,
                ]}
              >
                <PostVisual post={item} mini />

                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    item.id !== post.id && s.dimmed,
                  ]}
                />
              </Pressable>
            ))}
          </ScrollView>

          <View style={u.row}>
            <Action
              label="Anterior"
              icon="chevron-back"
              secondary
              onPress={previous}
              disabled={index === 0}
            />

            <Action
              label="Próxima"
              icon="chevron-forward"
              iconAfter
              onPress={next}
              disabled={index === posts.length - 1}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar postagem completa"
            onPress={() => onEdit(post)}
            style={s.editFullPost}
          >
            <Ionicons
              name="create-outline"
              color={palette.muted}
              size={16}
            />
            <Text style={s.editFullText}>
              Editar postagem completa
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

/* Tela principal */

export default function ProfileScreen() {
  const store = useProfileStore();

  const [screen, setScreen] = useState<Screen>({
    kind: 'profile',
  });

  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, 520);
  const tileSize = (pageWidth - 44 - 20) / 3;
  const profile = store.data.profile;

  function back() {
    if (store.saving) return;

    if (screen.kind === 'caption-editor') {
      setScreen({
        kind: 'detail',
        id: screen.id,
      });
    } else if (
      screen.kind === 'post-editor' &&
      screen.returnId
    ) {
      setScreen({
        kind: 'detail',
        id: screen.returnId,
      });
    } else {
      setScreen({ kind: 'profile' });
    }
  }

  async function saveProfile(value: FarmerProfile) {
    await store.saveProfile(value);
    setScreen({ kind: 'profile' });
  }

  async function savePost(value: FieldPost) {
    await store.savePost(value);
    setScreen({ kind: 'detail', id: value.id });
  }

  return (
    <LinearGradient
      colors={['#646c27', '#354e34', '#1b3539']}
      locations={[0, 0.48, 1]}
      style={s.root}
    >
      <StatusBar barStyle="light-content" />

      <SafeAreaView
        style={[s.page, { width: pageWidth }]}
      >
        {store.loading ? (
          <View style={s.loading}>
            <ActivityIndicator
              size="large"
              color={palette.yellow}
            />
            <Text style={s.helper}>
              Preparando seu campo…
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={s.profileScroll}
            showsVerticalScrollIndicator={false}
          >
            <ProfileHeader
              profile={profile}
              onEdit={() =>
                setScreen({ kind: 'profile-editor' })
              }
            />

            <View style={s.headerDivider} />

            <View style={s.dots} accessible={false}>
              <View style={s.dotActive} />
              <View style={s.dot} />
              <View style={s.dot} />
            </View>

            <FarmStats profile={profile} />

            <View style={s.prioritiesPanel}>
              <Text style={s.sectionTitle}>
                Prioridades Agrícolas
              </Text>

              <View style={u.wrap}>
                {profile.priorities.map(priority => (
                  <Chip
                    key={priority}
                    priority={priority}
                  />
                ))}
              </View>
            </View>

            <ErrorBox message={store.error} />

            <View style={s.recordsHeader}>
              <View style={s.recordsText}>
                <View style={s.recordsTitleRow}>
                  <Text
                    style={[
                      s.sectionTitle,
                      pageWidth < 390 && {
                        fontSize: 15,
                      },
                    ]}
                  >
                    Registros de Campo
                  </Text>

                  <View style={s.countBadge}>
                    <Text style={s.countText}>
                      {store.data.posts.length}
                    </Text>
                  </View>
                </View>

                <Text style={s.helper}>
                  Toque em uma foto para ver as boas técnicas.
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nova postagem"
                onPress={() =>
                  setScreen({
                    kind: 'post-editor',
                    post: newPost(profile),
                    creating: true,
                  })
                }
                style={({ pressed }) => [
                  s.newPostButton,
                  pageWidth < 390 && { width: 130 },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <LinearGradient
                  colors={[
                    palette.yellow,
                    palette.yellowDark,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.newPostGradient}
                >
                  <Ionicons
                    name="add"
                    size={23}
                    color={palette.ink}
                  />

                  <Text style={s.newPostText}>
                    Nova{'\n'}Postagem
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>

            <PostGrid
              posts={store.data.posts}
              onOpen={id =>
                setScreen({ kind: 'detail', id })
              }
              tileSize={tileSize}
            />
          </ScrollView>
        )}
      </SafeAreaView>

      <Modal
        visible={screen.kind !== 'profile'}
        animationType="slide"
        onRequestClose={back}
        presentationStyle="fullScreen"
      >
        <LinearGradient
          colors={['#525e24', '#253c31', '#1b3337']}
          locations={[0, 0.48, 1]}
          style={s.root}
        >
          <StatusBar barStyle="light-content" />

          <SafeAreaView
            style={[s.page, { width: pageWidth }]}
          >
            {screen.kind === 'detail' && (
              <>
                {!!store.error && (
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingTop: 8,
                    }}
                  >
                    <ErrorBox message={store.error} />
                  </View>
                )}

                <PostDetails
                  posts={store.data.posts}
                  id={screen.id}
                  saving={store.saving}
                  onSelect={id =>
                    setScreen({ kind: 'detail', id })
                  }
                  onClose={() =>
                    setScreen({ kind: 'profile' })
                  }
                  onLike={id => {
                    void store
                      .toggleLike(id)
                      .catch(() => undefined);
                  }}
                  onCaption={id =>
                    setScreen({
                      kind: 'caption-editor',
                      id,
                    })
                  }
                  onEdit={post =>
                    setScreen({
                      kind: 'post-editor',
                      post,
                      creating: false,
                      returnId: post.id,
                    })
                  }
                />
              </>
            )}

            {screen.kind === 'profile-editor' && (
              <ProfileEditor
                profile={profile}
                onClose={back}
                onSave={saveProfile}
                saving={store.saving}
              />
            )}

            {screen.kind === 'post-editor' && (
              <PostEditor
                key={screen.post.id}
                post={screen.post}
                creating={screen.creating}
                onClose={back}
                onSave={savePost}
                saving={store.saving}
              />
            )}

            {screen.kind === 'caption-editor' &&
              (() => {
                const post = store.data.posts.find(
                  item => item.id === screen.id,
                );

                return (
                  post && (
                    <CaptionEditor
                      post={post}
                      onClose={back}
                      saving={store.saving}
                      onSave={async notes => {
                        await store.setNotes(post.id, notes);

                        setScreen({
                          kind: 'detail',
                          id: post.id,
                        });
                      }}
                    />
                  )
                );
              })()}
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

/* Estilos compartilhados */

const u = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  actionShell: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    minWidth: 0,
  },
  action: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
  },
  secondaryAction: {
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  actionText: {
    color: palette.ink,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
    flexShrink: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,22,16,0.65)',
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  activeIcon: {
    backgroundColor: 'rgba(154,67,87,0.45)',
    borderColor: '#b76b7b',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  unselectedChip: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: palette.stroke,
  },
  field: {
    gap: 9,
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.text,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.stroke,
    backgroundColor: 'rgba(3,22,17,0.3)',
    color: palette.text,
    borderRadius: 14,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    color: palette.muted,
  },
  section: {
    marginBottom: 6,
  },
  sectionLabel: {
    color: palette.yellow,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 18,
    marginTop: 12,
  },
  errorBox: {
    borderRadius: 14,
    backgroundColor: '#633f30',
    borderWidth: 1,
    borderColor: '#ac7357',
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#ffe2d1',
    flex: 1,
    lineHeight: 20,
    fontSize: 13,
  },
  photoPreview: {
    height: 170,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#3c4b26',
    borderWidth: 1,
    borderColor: palette.stroke,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  avatarPreview: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderColor: palette.yellow,
    borderWidth: 3,
    alignSelf: 'center',
  },
  visual: {
    flex: 1,
    backgroundColor: '#394a21',
    position: 'relative',
    overflow: 'hidden',
  },
  coverFallback: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  coverText: {
    fontSize: 37,
    lineHeight: 44,
    fontWeight: '600',
    textAlign: 'center',
    color: '#f6f3dd',
  },
  miniCoverText: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '500',
  },
});

/* Estilos dos formulários */

const e = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.stroke,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.8,
    fontWeight: '700',
    color: '#d7cd96',
    marginBottom: 5,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: palette.text,
    letterSpacing: -0.6,
  },
  form: {
    padding: 23,
    paddingBottom: 30,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.muted,
    marginBottom: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: palette.stroke,
    backgroundColor: 'rgba(19,38,32,0.95)',
  },
  option: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.stroke,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  selectedOption: {
    borderColor: '#b59f53',
    backgroundColor: '#5c5528',
  },
  optionText: {
    color: palette.muted,
    fontSize: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  preview: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.stroke,
    overflow: 'hidden',
    backgroundColor: '#20332e',
    marginBottom: 20,
  },
  previewBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#405524',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#ba9b47',
  },
  previewBadgeText: {
    color: '#ffe29c',
    fontSize: 12,
    fontWeight: '800',
  },
  previewTitle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
    paddingTop: 70,
  },
  previewCategory: {
    color: '#dfca78',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 14,
  },
  previewHeading: {
    color: palette.text,
    fontSize: 23,
    fontWeight: '700',
    marginTop: 6,
  },
  previewBody: {
    padding: 18,
    gap: 8,
  },
  previewNotes: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 23,
  },
});

/* Estilos da tela de perfil e dos cards */

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
  },
  page: {
    flex: 1,
    maxWidth: 520,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  profileScroll: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 34,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
    minHeight: 110,
    paddingTop: 7,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: palette.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#8a9b50',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    paddingTop: 13,
  },
  name: {
    color: palette.text,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '800',
    letterSpacing: -0.9,
    paddingRight: 68,
  },
  location: {
    color: '#ede9ce',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    marginTop: 5,
  },
  locationDot: {
    color: '#c5c58a',
  },
  bio: {
    color: '#d6d7b4',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  editButton: {
    position: 'absolute',
    right: 0,
    top: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: palette.stroke,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#f4dfa1',
    fontSize: 12,
    fontWeight: '700',
  },
  headerDivider: {
    height: 1,
    backgroundColor: palette.stroke,
    marginTop: 20,
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 9,
    marginTop: 13,
    marginBottom: 30,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(218,222,172,0.35)',
  },
  dotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f6e2a3',
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 35,
  },
  statCard: {
    flex: 1,
    minHeight: 134,
    backgroundColor: 'rgba(224,229,177,0.12)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.stroke,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 19,
    paddingHorizontal: 6,
  },
  statLabel: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
  },
  statValue: {
    color: '#eef0da',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 3,
    flexShrink: 1,
  },
  prioritiesPanel: {
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.stroke,
    borderRadius: 26,
    padding: 17,
    gap: 15,
    marginBottom: 36,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  recordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 30,
  },
  recordsText: {
    flex: 1,
  },
  recordsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(226,224,173,0.17)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    color: '#f2d77d',
    fontSize: 13,
    fontWeight: '800',
  },
  helper: {
    color: '#c2ccbf',
    fontSize: 13,
    lineHeight: 19,
  },
  newPostButton: {
    borderRadius: 36,
    overflow: 'hidden',
    width: 148,
    shadowColor: palette.yellow,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 5,
  },
  newPostGradient: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: 16,
  },
  newPostText: {
    color: '#293220',
    fontWeight: '800',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245,244,216,0.5)',
    overflow: 'hidden',
  },
  gridCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingTop: 18,
    paddingBottom: 8,
  },
  gridTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fffdf1',
  },
  empty: {
    paddingVertical: 40,
    gap: 12,
    alignItems: 'center',
    width: '100%',
  },
  emptyTitle: {
    fontSize: 17,
    color: palette.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  detailScroll: {
    padding: 12,
    paddingBottom: 28,
  },
  detailCard: {
    borderWidth: 1,
    borderColor: '#697254',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(20,38,30,0.48)',
  },
  hero: {
    height: 334,
  },
  heroTop: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#3e5429',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#b7a052',
    flexShrink: 1,
  },
  badgeText: {
    color: '#fae3a0',
    fontWeight: '800',
    fontSize: 12,
    flexShrink: 1,
  },
  counter: {
    marginLeft: 'auto',
    borderRadius: 20,
    backgroundColor: 'rgba(8,16,7,0.82)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  counterText: {
    color: '#f4f5e9',
    fontSize: 12,
    fontWeight: '700',
  },
  backPill: {
    borderRadius: 20,
    backgroundColor: 'rgba(8,16,7,0.82)',
    paddingHorizontal: 9,
    minHeight: 32,
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  heroArrows: {
    position: 'absolute',
    top: 143,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroBottom: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 23,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroTitleBlock: {
    flex: 1,
  },
  category: {
    fontSize: 12,
    lineHeight: 17,
    color: '#e0cc7d',
    fontWeight: '800',
  },
  postTitle: {
    color: '#ffffff',
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.55,
    lineHeight: 28,
    marginTop: 3,
  },
  detailBody: {
    padding: 18,
    gap: 15,
  },
  notesBox: {
    borderWidth: 1,
    borderColor: palette.stroke,
    borderRadius: 20,
    backgroundColor: 'rgba(235,244,229,0.07)',
    padding: 15,
    gap: 10,
  },
  notesHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  notesLabel: {
    color: '#e6be58',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  editNotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 28,
  },
  editNotesText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f0d885',
  },
  notes: {
    color: '#f1f1e8',
    fontSize: 16,
    lineHeight: 25,
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(233,236,205,0.12)',
  },
  thumbnails: {
    gap: 7,
    padding: 2,
  },
  thumbnail: {
    width: 63,
    height: 63,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: palette.stroke,
    overflow: 'hidden',
  },
  selectedThumbnail: {
    borderWidth: 3,
    borderColor: '#e9c45c',
  },
  dimmed: {
    backgroundColor: 'rgba(10,24,15,0.35)',
  },
  editFullPost: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    minHeight: 32,
  },
  editFullText: {
    color: palette.muted,
    fontSize: 12,
  },
});
