# Edytor Tekstu z AI Asystentem

Nowoczesny edytor tekstu w stylu Notion z wbudowanym asystentem AI opartym na CopilotKit.

## 🚀 Funkcjonalności

- **Edytor BlockNote** - potężny, headless edytor tekstu w stylu Notion
- **AI Asystent** - inteligentny asystent CopilotKit z dostępem do treści dokumentu
- **Współdzielony stan** - synchronizacja stanu między edytorem a asystentem
- **Pełny ekran** - edytor zajmuje całą dostępną przestrzeń
- **Responsywny layout** - edytor + sidebar z asystentem

## 📦 Technologie

- **Next.js 15** - App Router
- **BlockNote** - edytor tekstu (headless)
- **CopilotKit** - framework dla AI asystentów
- **TypeScript** - typowanie
- **Tailwind CSS** - stylowanie

## 🛠️ Instalacja i uruchomienie

### 1. Zainstaluj zależności:
```bash
npm install
```

### 2. **WAŻNE: Skonfiguruj klucz API CopilotKit**

Aplikacja wymaga klucza API CopilotKit do działania asystenta AI:

1. Przejdź na: **https://cloud.copilotkit.ai**
2. Zarejestruj **darmowe** konto
3. Skopiuj swój klucz API
4. Utwórz plik `.env.local` w głównym katalogu projektu:

```bash
NEXT_PUBLIC_COPILOT_API_KEY=twoj_klucz_tutaj
```

### 3. Uruchom serwer deweloperski:
```bash
npm run dev
```

### 4. Otwórz przeglądarkę
Przejdź na: **http://localhost:3000**

> **Uwaga:** Jeśli nie skonfigurujesz klucza API, zobaczysz komunikat z instrukcjami na stronie.

## 📁 Struktura plików

```
app/
  ├── page.tsx          # Główny komponent z CopilotKit wrapper
  ├── layout.tsx        # Layout aplikacji
  └── globals.css       # Style globalne

components/
  ├── Editor.tsx        # Komponent edytora BlockNote
  └── MainView.tsx      # Główny widok z integracją CopilotKit
```

## 🔧 Kluczowe koncepcje

### Współdzielony stan (Shared State)

Aplikacja wykorzystuje `useCoAgent` do zarządzania współdzielonym stanem między UI a asystentem:

```typescript
const { state, setState } = useCoAgent<DocumentState>({
  name: "document_agent",
  initialState: { content: [] },
});
```

### Udostępnianie kontekstu asystentowi

Treść dokumentu jest udostępniana asystentowi poprzez `useCopilotReadable`:

```typescript
useCopilotReadable({
  description: "Zawartość dokumentu edytora",
  value: state.content,
});
```

### Synchronizacja edytora

Zmiany w edytorze są automatycznie synchronizowane ze stanem:

```typescript
<Editor
  content={state.content}
  onChange={(blocks) => setState({ content: blocks })}
/>
```

## 💡 Możliwości asystenta

Asystent AI ma dostęp do:
- Pełnej treści dokumentu w czasie rzeczywistym
- Możliwości edycji poprzez współdzielony stan
- Kontekstu użytkownika i aplikacji

Może pomagać w:
- Edycji i formatowaniu tekstu
- Sugerowaniu zmian
- Generowaniu treści
- Poprawianiu gramatyki i stylu

## 📝 Licencja

MIT
