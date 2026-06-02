import { Component, PropsWithChildren } from "react";
import { Pressable, Text, View } from "react-native";

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center bg-surface px-6">
          <Text className="text-center text-xl font-bold text-slate-900">MoneyTrack 出错了</Text>
          <Text className="mt-3 text-center text-sm leading-6 text-slate-500">
            页面加载失败，请返回后重试。错误信息：{this.state.error.message}
          </Text>
          <Pressable className="mt-6 rounded-2xl bg-blue-600 px-5 py-3" onPress={this.reset}>
            <Text className="font-semibold text-white">重试</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
