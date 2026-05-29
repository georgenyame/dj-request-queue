#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>

@implementation AppDelegate

- (void)applicationWillFinishLaunching:(NSNotification *)notification
{
  // Route custom URL scheme (djcommandcenter://) deep links to JS Linking.
  // Registered here so it is in place before a cold-launch GetURL event arrives.
  [[NSAppleEventManager sharedAppleEventManager]
      setEventHandler:[RCTLinkingManager class]
          andSelector:@selector(getUrlEventHandler:withReplyEvent:)
        forEventClass:kInternetEventClass
           andEventID:kAEGetURL];
}

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
  self.moduleName = @"DJCommandCenter";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // RCTAppDelegate only sets this in -init, but the storyboard instantiates us
  // via -initWithCoder:, so enable window auto-loading explicitly.
  self.automaticallyLoadReactNativeWindow = YES;

  [super applicationDidFinishLaunching:notification];
}

// Required by RN 0.76's RCTRootViewFactory / RCTHost (new architecture).
// Without this override RCTAppDelegate throws "Subclasses must implement a
// valid getBundleURL method", which aborts launch before the window appears.
- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
#ifdef RN_FABRIC_ENABLED
  return true;
#else
  return false;
#endif
}

@end
