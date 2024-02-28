using System.Windows.Input;

namespace ColorBlindPicker.ApplicationLayer.Models;

//public class RelayCommand : ICommand
//{
//    private readonly Action<object> _execute;
//    private readonly Func<object, bool> _canExecute;

//    public RelayCommand(Action<object> execute, Func<object, bool> canExecute = null)
//    {
//        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
//        _canExecute = canExecute;
//    }

//    public bool CanExecute(object parameter)
//    {
//        return _canExecute == null || _canExecute(parameter);
//    }

//    public void Execute(object parameter)
//    {
//        _execute(parameter);
//    }

//    public event EventHandler CanExecuteChanged
//    {
//        add => CommandManager.RequerySuggested += value;
//        remove => CommandManager.RequerySuggested -= value;
//    }
//}

public class RelayCommand : ICommand
{
    private readonly Action<object> execute;
    private readonly Func<object, bool> canExecute;

    public event EventHandler CanExecuteChanged;

    public RelayCommand(Action<object> execute, Func<object, bool> canExecute = null)
    {
        this.execute = execute ?? throw new ArgumentNullException(nameof(execute));
        this.canExecute = canExecute;
    }

    public bool CanExecute(object parameter)
    {
        return canExecute == null || canExecute(parameter);
    }

    public void Execute(object parameter)
    {
        execute(parameter);
    }

    public void RaiseCanExecuteChanged()
    {
        CanExecuteChanged?.Invoke(this, EventArgs.Empty);
    }
}