using ColorBlindPicker.ApplicationLayer.Enums;
using System.Globalization;
using System.Windows;
using WPFLocalizeExtension.Engine;

namespace ColorBlindPicker.Windows
{
    /// <summary>
    /// Interaction logic for SettingsWindow.xaml
    /// </summary>
    public partial class SettingsWindow : Window
    {
        MainWindow mainWindow = Application.Current.MainWindow as MainWindow;

        public SettingsWindow()
        {
            InitializeComponent();
        }

        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            MoveBottomRightEdgeOfWindowToMousePosition();
            var languages = Enum.GetNames(typeof(Languages));
            this.Topmost = mainWindow.Topmost;

            CmbLanguage.SelectedIndex = Array.IndexOf(languages, LocalizeDictionary.Instance.Culture.TwoLetterISOLanguageName);
        }

        private void MoveBottomRightEdgeOfWindowToMousePosition()
        {
            var transform = PresentationSource.FromVisual(this)?.CompositionTarget?.TransformFromDevice;
            if (transform.HasValue)
            {
                var mouse = transform.Value.Transform(GetMousePosition());
                Left = mouse.X - ActualWidth;
                Top = mouse.Y - ActualHeight;
            }
        }

        public System.Windows.Point GetMousePosition()
        {
            var point = System.Windows.Input.Mouse.GetPosition(this);
            return new System.Windows.Point(point.X + Left, point.Y + Top);
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }

        private void CmbLanguage_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
        {
            if (CmbLanguage.SelectedValue != null)
            {
                LocalizeDictionary.Instance.Culture = new CultureInfo((string)CmbLanguage.SelectedValue);
            }
        }
    }
}
