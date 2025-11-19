-- Update RLS Policies to allow both authenticated and anonymous users

-- Drop existing policies for conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;

-- Drop existing policies for messages
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON public.messages;

-- RLS Policies for conversations - allow authenticated users
CREATE POLICY "Authenticated users can view their conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id AND user_id != 'local');

CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id AND user_id != 'local');

CREATE POLICY "Authenticated users can update conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id AND user_id != 'local');

CREATE POLICY "Authenticated users can delete conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id AND user_id != 'local');

-- RLS Policies for messages - allow authenticated users
CREATE POLICY "Authenticated users can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
      AND conversations.user_id != 'local'
    )
  );

CREATE POLICY "Authenticated users can create messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
      AND conversations.user_id != 'local'
    )
  );

CREATE POLICY "Authenticated users can delete messages"
  ON public.messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
      AND conversations.user_id != 'local'
    )
  );
